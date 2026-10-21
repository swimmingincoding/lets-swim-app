import fitz
import re
import json
import os

# ==============================================================================
# Official Competition Schedule Mapping from:
# 'SW TIMELINE rev 030825 FINAL .pdf' (Official World Aquatics Singapore 2025)
# ==============================================================================
EVENT_SCHEDULE_MAP = {
    # DAY 1: THURSDAY AUGUST 7 (8/7 목) - 1일차: 여 WCA, 남 OCBC
    "800m Freestyle Men": {
        "day": 1, "date": "2025-08-07", "date_label": "8/7(목)",
        "session": "Morning", "event_order": 1, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "15:55"
    },
    "800m Freestyle Women": {
        "day": 1, "date": "2025-08-07", "date_label": "8/7(목)",
        "session": "Morning", "event_order": 2, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "14:39"
    },

    # DAY 2: FRIDAY AUGUST 8 (8/8 금)
    "200m Backstroke Men": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 3, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "10:40"
    },
    "200m Backstroke Women": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 4, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "11:03"
    },
    "100m Freestyle Men": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 5, "time_est": "10:40",
        "venue": "World Aquatics Arena (WCA)", "end_est": "12:09"
    },
    "100m Freestyle Women": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 6, "time_est": "11:03",
        "venue": "OCBC Aquatic Center", "end_est": "12:41"
    },
    "100m Breaststroke Men": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 7, "time_est": "12:09",
        "venue": "World Aquatics Arena (WCA)", "end_est": "13:40"
    },
    "100m Breaststroke Women": {
        "day": 2, "date": "2025-08-08", "date_label": "8/8(금)",
        "session": "Morning", "event_order": 8, "time_est": "12:41",
        "venue": "OCBC Aquatic Center", "end_est": "14:17"
    },

    # DAY 3: SUNDAY AUGUST 10 (8/10 일) - 3일차: 여 WCA, 남 OCBC
    "400m Individual Medley Men": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Morning", "event_order": 9, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "11:20"
    },
    "400m Individual Medley Women": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Morning", "event_order": 10, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "11:45"
    },
    "200m Freestyle Men": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Morning", "event_order": 11, "time_est": "11:20",
        "venue": "OCBC Aquatic Center", "end_est": "13:53"
    },
    "200m Freestyle Women": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Morning", "event_order": 12, "time_est": "11:45",
        "venue": "World Aquatics Arena (WCA)", "end_est": "14:43"
    },
    "50m Butterfly Men": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Afternoon", "event_order": 13, "time_est": "13:53",
        "venue": "OCBC Aquatic Center", "end_est": "14:46"
    },
    "50m Butterfly Women": {
        "day": 3, "date": "2025-08-10", "date_label": "8/10(일)",
        "session": "Afternoon", "event_order": 14, "time_est": "14:43",
        "venue": "World Aquatics Arena (WCA)", "end_est": "16:19"
    },

    # DAY 4: MONDAY AUGUST 11 (8/11 월)
    "50m Freestyle Men": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Morning", "event_order": 15, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "11:12"
    },
    "50m Freestyle Women": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Morning", "event_order": 16, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "10:43"
    },
    "200m Individual Medley Men": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Morning", "event_order": 17, "time_est": "11:12",
        "venue": "World Aquatics Arena (WCA)", "end_est": "14:08"
    },
    "200m Individual Medley Women": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Morning", "event_order": 18, "time_est": "10:43",
        "venue": "OCBC Aquatic Center", "end_est": "12:11"
    },
    "100m Butterfly Men": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Afternoon", "event_order": 19, "time_est": "14:08",
        "venue": "World Aquatics Arena (WCA)", "end_est": "15:16"
    },
    "100m Butterfly Women": {
        "day": 4, "date": "2025-08-11", "date_label": "8/11(월)",
        "session": "Afternoon", "event_order": 20, "time_est": "12:11",
        "venue": "OCBC Aquatic Center", "end_est": "13:14"
    },

    # DAY 5: TUESDAY AUGUST 12 (8/12 화) - 5일차: 여 WCA, 남 OCBC
    "200m Breaststroke Men": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Morning", "event_order": 21, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "11:48"
    },
    "200m Breaststroke Women": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Morning", "event_order": 22, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "11:46"
    },
    "100m Backstroke Men": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Morning", "event_order": 23, "time_est": "11:48",
        "venue": "OCBC Aquatic Center", "end_est": "13:21"
    },
    "100m Backstroke Women": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Morning", "event_order": 24, "time_est": "11:46",
        "venue": "World Aquatics Arena (WCA)", "end_est": "12:59"
    },
    "200m Butterfly Men": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Afternoon", "event_order": 25, "time_est": "13:21",
        "venue": "OCBC Aquatic Center", "end_est": "14:51"
    },
    "200m Butterfly Women": {
        "day": 5, "date": "2025-08-12", "date_label": "8/12(화)",
        "session": "Afternoon", "event_order": 26, "time_est": "12:59",
        "venue": "World Aquatics Arena (WCA)", "end_est": "14:33"
    },

    # DAY 6: WEDNESDAY AUGUST 13 (8/13 수)
    "50m Backstroke Men": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Morning", "event_order": 27, "time_est": "09:00",
        "venue": "World Aquatics Arena (WCA)", "end_est": "10:03"
    },
    "50m Backstroke Women": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Morning", "event_order": 28, "time_est": "09:00",
        "venue": "OCBC Aquatic Center", "end_est": "10:12"
    },
    "400m Freestyle Men": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Morning", "event_order": 29, "time_est": "10:03",
        "venue": "World Aquatics Arena (WCA)", "end_est": "13:26"
    },
    "400m Freestyle Women": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Morning", "event_order": 30, "time_est": "10:12",
        "venue": "OCBC Aquatic Center", "end_est": "13:56"
    },
    "50m Breaststroke Men": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Afternoon", "event_order": 31, "time_est": "13:26",
        "venue": "World Aquatics Arena (WCA)", "end_est": "14:57"
    },
    "50m Breaststroke Women": {
        "day": 6, "date": "2025-08-13", "date_label": "8/13(수)",
        "session": "Afternoon", "event_order": 32, "time_est": "13:56",
        "venue": "OCBC Aquatic Center", "end_est": "15:17"
    },

    # DAY 7: THURSDAY AUGUST 14 (8/14 목) - RELAY ALL EVENTS (OCBC AQUATIC CENTER ONLY)
    "4x50m Freestyle Men": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Morning", "event_order": 33, "time_est": "09:00",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "09:48"
    },
    "4x50m Freestyle Women": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Morning", "event_order": 34, "time_est": "09:48",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "10:36"
    },
    "4x50m Medley Men": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Morning", "event_order": 35, "time_est": "10:36",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "12:28"
    },
    "4x50m Medley Women": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Morning", "event_order": 36, "time_est": "12:28",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "13:30"
    },
    "4x50m Freestyle Mixed": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Afternoon", "event_order": 37, "time_est": "13:30",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "14:35"
    },
    "4x50m Medley Mixed": {
        "day": 7, "date": "2025-08-14", "date_label": "8/14(목)",
        "session": "Afternoon", "event_order": 38, "time_est": "14:35",
        "venue": "OCBC Aquatic Center (Day 7 계영 전용)", "end_est": "16:00"
    }
}

def parse_time_to_seconds(t_str):
    if not t_str or t_str == "NT":
        return 999999.0
    try:
        if ":" in t_str:
            parts = t_str.split(":")
            m = float(parts[0])
            s = float(parts[1])
            return round(m * 60 + s, 2)
        else:
            return round(float(t_str), 2)
    except:
        return 999999.0

def clean_event_name(ev):
    ev = ev.strip()
    ev = ev.replace("Indivdual", "Individual")
    return ev

def parse_all_pdfs(men_path, women_path):
    athletes = {}
    teams = set()
    events_list = []
    all_entries = []
    all_relays = []

    files = [
        (men_path, "M"),
        (women_path, "W")
    ]

    for fpath, file_default_gender in files:
        if not os.path.exists(fpath):
            print(f"File not found: {fpath}")
            continue

        doc = fitz.open(fpath)
        current_event = None
        current_category = None
        current_cr = None
        current_wr = None
        current_qs = None

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            raw_lines = [l.strip() for l in text.split("\n") if l.strip()]

            lines = []
            for l in raw_lines:
                if "Singapore / 26/07" in l or "Data Processing by Microplus" in l or "Printed on " in l:
                    continue
                if re.match(r"^Page \d+$", l):
                    continue
                lines.append(l)

            i = 0
            while i < len(lines):
                line = lines[i]

                # Check for event header
                if any(k in line for k in ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Medley"]) and any(d in line for d in ["50m", "100m", "200m", "400m", "800m", "4x50m"]):
                    norm_event = clean_event_name(line)
                    if norm_event != current_event:
                        current_event = norm_event
                        if current_event not in [e["name"] for e in events_list]:
                            sched = EVENT_SCHEDULE_MAP.get(current_event, {
                                "day": 1, "date": "2025-08-07", "date_label": "8/7(목)",
                                "session": "Morning", "event_order": 99, "time_est": "09:00",
                                "venue": "WCA / OCBC", "end_est": "17:00"
                            })
                            events_list.append({
                                "name": current_event,
                                "is_relay": "4x50m" in current_event,
                                "day": sched["day"],
                                "date": sched.get("date", "2025-08-07"),
                                "date_label": sched.get("date_label", "8/7(목)"),
                                "session": sched["session"],
                                "event_order": sched["event_order"],
                                "time_est": sched["time_est"],
                                "venue": sched.get("venue", "WCA / OCBC"),
                                "end_est": sched.get("end_est", "")
                            })
                    i += 1
                    continue

                # Category header
                cat_match = re.match(r"^(?:MASTER|PRE-MASTER)\s+(\d+-\d+)", line)
                if cat_match:
                    current_category = cat_match.group(1)
                    current_cr = None
                    current_wr = None
                    current_qs = None
                    i += 1
                    continue

                if line.startswith("QUALIFYING STANDARD:"):
                    parts = line.split(":")
                    if len(parts) > 1:
                        current_qs = parts[1].strip()
                    i += 1
                    continue

                if line == "CR :":
                    if i + 1 < len(lines):
                        current_cr = lines[i+1]
                        i += 2
                        continue
                if line == "WR :":
                    if i + 1 < len(lines):
                        current_wr = lines[i+1]
                        i += 2
                        continue

                if line in ["World Aquatics Masters Championships", "Swimming", "Entry List", "ORD", "SURNAME & NAME", "BORN CAT", "TEAM", "E.TIME", "RELAY", "CAT"]:
                    i += 1
                    continue

                is_relay_event = current_event and "4x50m" in current_event

                if is_relay_event:
                    if re.match(r"^\d+$", line):
                        relay_ord = int(line)
                        if i + 3 < len(lines):
                            relay_name = lines[i+1]
                            cat_cand = lines[i+2]
                            time_cand = lines[i+3]

                            if re.match(r"^\d+-\d+$", cat_cand):
                                relay_entry_time = time_cand
                                curr_idx = i + 4
                                members = []

                                for _ in range(4):
                                    if curr_idx + 2 < len(lines):
                                        m_name = lines[curr_idx]
                                        m_gender = lines[curr_idx+1]
                                        m_age = lines[curr_idx+2]
                                        if m_gender in ["M", "W"] and re.match(r"^\d+$", m_age):
                                            members.append({
                                                "name": m_name,
                                                "gender": m_gender,
                                                "age": int(m_age)
                                            })
                                            curr_idx += 3
                                        else:
                                            break
                                    else:
                                        break

                                sched = EVENT_SCHEDULE_MAP.get(current_event, {})
                                relay_obj = {
                                    "id": f"relay_{len(all_relays) + 1}",
                                    "event": current_event,
                                    "category": cat_cand,
                                    "order": relay_ord,
                                    "name": relay_name,
                                    "entry_time": relay_entry_time,
                                    "entry_time_seconds": parse_time_to_seconds(relay_entry_time),
                                    "members": members,
                                    "day": sched.get("day", 7),
                                    "date": sched.get("date", "2025-08-14"),
                                    "date_label": sched.get("date_label", "8/14(목)"),
                                    "session": sched.get("session", "Morning"),
                                    "time_est": sched.get("time_est", "09:00"),
                                    "venue": sched.get("venue", "OCBC Aquatic Center")
                                }
                                all_relays.append(relay_obj)
                                teams.add(relay_name.split()[0])
                                i = curr_idx
                                continue

                else:
                    if re.match(r"^\d+$", line):
                        entry_ord = int(line)
                        born_offset = -1
                        for offset in range(1, 4):
                            if i + offset < len(lines):
                                cand = lines[i + offset]
                                if re.match(r"^(19\d\d|20\d\d)$", cand):
                                    born_offset = offset
                                    break
                        
                        if born_offset != -1:
                            name_parts = [lines[i + k] for k in range(1, born_offset)]
                            ath_name = " ".join(name_parts).strip()
                            birth_year = int(lines[i + born_offset])
                            
                            if i + born_offset + 1 < len(lines):
                                cat_str = lines[i + born_offset + 1]
                                time_offset = -1
                                for t_off in range(born_offset + 2, born_offset + 5):
                                    if i + t_off < len(lines):
                                        tcand = lines[i + t_off]
                                        if re.match(r"^(?:\d+:)?\d{1,2}\.\d{2}$", tcand) or tcand == "NT":
                                            time_offset = t_off
                                            break
                                
                                if time_offset != -1:
                                    team_parts = [lines[i + k] for k in range(born_offset + 2, time_offset)]
                                    team_name = " ".join(team_parts).strip()
                                    entry_time_str = lines[i + time_offset]
                                    
                                    gender = "M" if "Men" in (current_event or "") else ("W" if "Women" in (current_event or "") else file_default_gender)
                                    
                                    ath_key = (ath_name, gender, birth_year)
                                    if ath_key not in athletes:
                                        athletes[ath_key] = {
                                            "id": f"ath_{len(athletes) + 1}",
                                            "name": ath_name,
                                            "gender": gender,
                                            "birth_year": birth_year,
                                            "category": cat_str,
                                            "team": team_name,
                                            "entries": []
                                        }
                                    
                                    ath_id = athletes[ath_key]["id"]
                                    if not athletes[ath_key]["team"] and team_name:
                                        athletes[ath_key]["team"] = team_name
                                        
                                    sched = EVENT_SCHEDULE_MAP.get(current_event, {})
                                    entry_obj = {
                                        "id": f"entry_{len(all_entries) + 1}",
                                        "athlete_id": ath_id,
                                        "athlete_name": ath_name,
                                        "gender": gender,
                                        "birth_year": birth_year,
                                        "team": team_name,
                                        "event": current_event,
                                        "category": cat_str,
                                        "order": entry_ord,
                                        "entry_time": entry_time_str,
                                        "entry_time_seconds": parse_time_to_seconds(entry_time_str),
                                        "qualifying_standard": current_qs,
                                        "cr": current_cr,
                                        "wr": current_wr,
                                        "day": sched.get("day", 1),
                                        "date": sched.get("date", "2025-08-07"),
                                        "date_label": sched.get("date_label", "8/7(목)"),
                                        "session": sched.get("session", "Morning"),
                                        "time_est": sched.get("time_est", "09:00"),
                                        "venue": sched.get("venue", "WCA / OCBC"),
                                        "end_est": sched.get("end_est", "")
                                    }
                                    all_entries.append(entry_obj)
                                    athletes[ath_key]["entries"].append(entry_obj["id"])
                                    teams.add(team_name)

                                    i = i + time_offset + 1
                                    continue

                i += 1

        print(f"Finished {fpath}: {len(all_entries)} individual entries, {len(all_relays)} relays parsed so far.")

    # Calculate rankings within (event, category)
    print("Calculating category rankings and seeding...")
    category_groups = {}
    for entry in all_entries:
        key = (entry["event"], entry["category"])
        if key not in category_groups:
            category_groups[key] = []
        category_groups[key].append(entry)

    for key, group in category_groups.items():
        group.sort(key=lambda x: x["entry_time_seconds"])
        total_in_cat = len(group)
        for rank, entry in enumerate(group, start=1):
            entry["rank_in_category"] = rank
            entry["total_in_category"] = total_in_cat
            lanes_per_heat = 10
            heat_no = ((rank - 1) // lanes_per_heat) + 1
            lane_no = ((rank - 1) % lanes_per_heat) + 1
            entry["estimated_heat"] = heat_no
            entry["estimated_lane"] = lane_no

    final_athletes = list(athletes.values())
    print(f"\nFinal Summary:")
    print(f"Total Athletes: {len(final_athletes)}")
    print(f"Total Individual Entries: {len(all_entries)}")
    print(f"Total Relays: {len(all_relays)}")
    print(f"Total Teams: {len(teams)}")
    print(f"Total Events: {len(events_list)}")

    output_data = {
        "metadata": {
            "title": "World Aquatics Masters Championships - Singapore 2025",
            "version": "20250814_official_timeline_rev_030825_venues_v4",
            "timeline_source": "SW TIMELINE rev 030825 FINAL .pdf",
            "extracted_at": "2026-10-16",
            "total_athletes": len(final_athletes),
            "total_entries": len(all_entries),
            "total_relays": len(all_relays),
            "total_teams": len(teams),
            "total_events": len(events_list)
        },
        "events": events_list,
        "athletes": final_athletes,
        "entries": all_entries,
        "relays": all_relays,
        "teams": sorted(list(teams))
    }

    return output_data

if __name__ == "__main__":
    data = parse_all_pdfs("SWM_EntryList MEN.pdf", "SWM_EntryList WOMEN.pdf")
    os.makedirs("public/data", exist_ok=True)
    out_file = "public/data/masters_data.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved to {out_file} (Size: {os.path.getsize(out_file) / 1024 / 1024:.2f} MB)")
