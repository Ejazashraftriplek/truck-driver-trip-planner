from datetime import datetime, timedelta

# HOS Constants
MAX_DRIVING_WINDOW = 14.0
MAX_DRIVING = 11.0
BREAK_AFTER_DRIVING = 8.0
BREAK_DURATION = 0.5
OFF_DUTY_RESET = 10.0
CYCLE_LIMIT = 70.0
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_DURATION = 0.5
PICKUP_DURATION = 1.0
DROPOFF_DURATION = 1.0
PRE_TRIP_DURATION = 0.25


def plan_trip(route_data, current_cycle_used, start_time=None):
    if start_time is None:
        start_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
        if start_time < datetime.now():
            start_time += timedelta(days=1)

    total_miles = route_data['total_distance_miles']

    state = {
        'current_time': start_time,
        'driving_since_break': 0.0,
        'driving_in_window': 0.0,
        'on_duty_in_window': 0.0,
        'window_start': start_time,
        'cycle_used': current_cycle_used,
        'miles_since_fuel': 0.0,
        'current_mile': 0.0,
        'total_route_miles': total_miles,
        'segments': [],
    }

    locations = route_data['locations']

    # Pre-trip inspection
    add_on_duty_segment(state, PRE_TRIP_DURATION, locations['current'], 'Pre-trip inspection')

    # Leg 1: Drive to pickup
    drive_leg(state, route_data['legs'][0])

    # Pickup: 1 hour on-duty not driving
    add_on_duty_segment(state, PICKUP_DURATION, locations['pickup'], 'Pickup')

    # Leg 2: Drive to dropoff
    drive_leg(state, route_data['legs'][1])

    # Dropoff: 1 hour on-duty not driving
    add_on_duty_segment(state, DROPOFF_DURATION, locations['dropoff'], 'Dropoff')

    # Build results
    eld_logs = generate_eld_logs(state['segments'])
    total_driving = sum(s['duration'] for s in state['segments'] if s['status'] == 'driving')

    return {
        'stops': extract_stops(state['segments']),
        'eld_logs': eld_logs,
        'total_distance_miles': total_miles,
        'total_driving_hours': round(total_driving, 2),
        'total_trip_days': len(eld_logs),
    }


def drive_leg(state, leg):
    remaining_miles = leg['distance_miles']
    remaining_hours = leg['duration_hours']
    if remaining_hours <= 0:
        return
    avg_speed = remaining_miles / remaining_hours

    while remaining_hours > 0.01:
        check_and_take_rest_if_needed(state)

        time_until_break = BREAK_AFTER_DRIVING - state['driving_since_break']
        time_until_11hr = MAX_DRIVING - state['driving_in_window']
        time_until_14hr = MAX_DRIVING_WINDOW - hours_elapsed(state['window_start'], state['current_time'])
        time_until_cycle = CYCLE_LIMIT - state['cycle_used']
        time_until_fuel = (FUEL_INTERVAL_MILES - state['miles_since_fuel']) / avg_speed if avg_speed > 0 else 999

        driveable = max(0, min(
            time_until_break, time_until_11hr, time_until_14hr,
            time_until_cycle, time_until_fuel, remaining_hours,
        ))

        if driveable < 0.01:
            reason = find_limiting_reason(state, avg_speed)
            handle_stop(state, reason)
            continue

        miles_driven = driveable * avg_speed
        add_segment(state, 'driving', driveable, None, 'Driving')
        state['driving_since_break'] += driveable
        state['driving_in_window'] += driveable
        state['on_duty_in_window'] += driveable
        state['cycle_used'] += driveable
        state['miles_since_fuel'] += miles_driven
        state['current_mile'] += miles_driven
        remaining_hours -= driveable
        remaining_miles -= miles_driven

        if remaining_hours > 0.01:
            reason = find_limiting_reason(state, avg_speed)
            handle_stop(state, reason)


def check_and_take_rest_if_needed(state):
    window_elapsed = hours_elapsed(state['window_start'], state['current_time'])
    if (state['driving_in_window'] >= MAX_DRIVING or
            window_elapsed >= MAX_DRIVING_WINDOW or
            state['cycle_used'] >= CYCLE_LIMIT):
        take_10hr_rest(state)


def find_limiting_reason(state, avg_speed):
    window_elapsed = hours_elapsed(state['window_start'], state['current_time'])
    if state['driving_since_break'] >= BREAK_AFTER_DRIVING - 0.01:
        return '8hr_break'
    if state['miles_since_fuel'] >= FUEL_INTERVAL_MILES - 1:
        return 'fuel'
    if state['driving_in_window'] >= MAX_DRIVING - 0.01:
        return '11hr_driving'
    if window_elapsed >= MAX_DRIVING_WINDOW - 0.01:
        return '14hr_window'
    if state['cycle_used'] >= CYCLE_LIMIT - 0.01:
        return 'cycle_limit'
    return '8hr_break'


def handle_stop(state, reason):
    mile = state['current_mile']
    fraction = mile / state['total_route_miles'] if state['total_route_miles'] > 0 else 0

    if reason == '8hr_break':
        add_segment(state, 'off_duty', BREAK_DURATION,
                    {'mile_marker': round(mile), 'fraction': fraction}, '30-minute rest break')
        state['driving_since_break'] = 0

    elif reason == 'fuel':
        if state['driving_since_break'] >= BREAK_AFTER_DRIVING - 0.5:
            add_segment(state, 'off_duty', BREAK_DURATION,
                        {'mile_marker': round(mile), 'fraction': fraction}, 'Fuel stop + rest break')
            state['driving_since_break'] = 0
        else:
            add_segment(state, 'on_duty_not_driving', FUEL_STOP_DURATION,
                        {'mile_marker': round(mile), 'fraction': fraction}, 'Fuel stop')
            state['on_duty_in_window'] += FUEL_STOP_DURATION
            state['cycle_used'] += FUEL_STOP_DURATION
        state['miles_since_fuel'] = 0

    elif reason in ('11hr_driving', '14hr_window', 'cycle_limit'):
        take_10hr_rest(state)


def take_10hr_rest(state):
    mile = state['current_mile']
    fraction = mile / state['total_route_miles'] if state['total_route_miles'] > 0 else 0

    add_segment(state, 'sleeper_berth', OFF_DUTY_RESET,
                {'mile_marker': round(mile), 'fraction': fraction}, '10-hour rest (sleeper berth)')
    state['driving_since_break'] = 0
    state['driving_in_window'] = 0
    state['on_duty_in_window'] = 0
    state['window_start'] = state['current_time']
    add_segment(state, 'on_duty_not_driving', PRE_TRIP_DURATION,
                {'mile_marker': round(mile), 'fraction': fraction}, 'Pre-trip inspection')
    state['on_duty_in_window'] += PRE_TRIP_DURATION
    state['cycle_used'] += PRE_TRIP_DURATION


def add_on_duty_segment(state, duration, location, remark):
    window_elapsed = hours_elapsed(state['window_start'], state['current_time'])
    if window_elapsed + duration > MAX_DRIVING_WINDOW or state['cycle_used'] + duration > CYCLE_LIMIT:
        take_10hr_rest(state)
    add_segment(state, 'on_duty_not_driving', duration, location, remark)
    state['on_duty_in_window'] += duration
    state['cycle_used'] += duration


def add_segment(state, status, duration, location, remark):
    start_time = state['current_time']
    end_time = start_time + timedelta(hours=duration)
    state['segments'].append({
        'status': status,
        'start_time': start_time.isoformat(),
        'end_time': end_time.isoformat(),
        'duration': round(duration, 4),
        'location': location,
        'remark': remark,
    })
    state['current_time'] = end_time


def extract_stops(segments):
    stops = []
    for seg in segments:
        if seg['status'] != 'driving':
            stops.append({
                'type': classify_stop(seg['remark']),
                'location': seg['location'],
                'arrival_time': seg['start_time'],
                'departure_time': seg['end_time'],
                'duration_hours': seg['duration'],
                'duty_status': seg['status'],
                'remark': seg['remark'],
            })
    return stops


def classify_stop(remark):
    remark_lower = (remark or '').lower()
    if 'pickup' in remark_lower:
        return 'pickup'
    if 'dropoff' in remark_lower:
        return 'dropoff'
    if 'fuel' in remark_lower:
        return 'fuel'
    if '10-hour' in remark_lower or 'sleeper' in remark_lower:
        return 'overnight_rest'
    if 'break' in remark_lower or '30-min' in remark_lower:
        return 'rest_break'
    if 'pre-trip' in remark_lower:
        return 'pre_trip'
    return 'other'


def generate_eld_logs(segments):
    days = {}
    for seg in segments:
        start = datetime.fromisoformat(seg['start_time'])
        end = datetime.fromisoformat(seg['end_time'])
        current = start
        while current.date() < end.date():
            midnight = datetime.combine(current.date() + timedelta(days=1), datetime.min.time())
            add_to_day(days, current.date(), seg['status'],
                       hours_since_midnight(current), 24.0, seg['remark'])
            current = midnight
        add_to_day(days, current.date(), seg['status'],
                   hours_since_midnight(current), hours_since_midnight(end), seg['remark'])

    eld_logs = []
    for date in sorted(days.keys()):
        day_segments = days[date]
        if day_segments and day_segments[0]['start'] > 0.01:
            day_segments.insert(0, {'status': 'off_duty', 'start': 0.0, 'end': day_segments[0]['start'], 'remark': ''})
        if day_segments and day_segments[-1]['end'] < 23.99:
            day_segments.append({'status': 'off_duty', 'start': day_segments[-1]['end'], 'end': 24.0, 'remark': ''})
        totals = compute_totals(day_segments)
        eld_logs.append({'date': str(date), 'segments': day_segments, 'totals': totals})
    return eld_logs


def add_to_day(days, date, status, start_hour, end_hour, remark):
    if date not in days:
        days[date] = []
    if end_hour - start_hour > 0.001:
        days[date].append({'status': status, 'start': round(start_hour, 4), 'end': round(end_hour, 4), 'remark': remark})


def compute_totals(day_segments):
    totals = {'off_duty': 0, 'sleeper_berth': 0, 'driving': 0, 'on_duty_not_driving': 0}
    for seg in day_segments:
        duration = seg['end'] - seg['start']
        if seg['status'] in totals:
            totals[seg['status']] += duration
    return {k: round(v, 2) for k, v in totals.items()}


def hours_elapsed(start, end):
    return (end - start).total_seconds() / 3600


def hours_since_midnight(dt):
    return dt.hour + dt.minute / 60 + dt.second / 3600
