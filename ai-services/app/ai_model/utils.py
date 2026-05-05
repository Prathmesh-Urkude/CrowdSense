def calculate_severity(confidence, damage_type):
    score = confidence * 10
    if damage_type == "pothole":
        score += 5
    elif damage_type == "alligator_crack":
        score += 2.5
    elif damage_type == "transverse_crack":
        score += 2
    elif damage_type == "longitudinal_crack":
        score += 1
    else : score = 0
    return min(round(score, 2), 10)

# def get_priority(score):
#     if score < 3:
#         return "Low Priority"
#     elif score < 7:
#         return "Medium Priority"
#     else:
#         return "High Priority (Repair Needed)"