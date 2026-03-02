with open('ai_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with the new GENERAL FALLBACK return statement (last real line of new function)
# It ends with the Hindi version of the smart fallback
cutline = None
for i, line in enumerate(lines):
    if 'Boss, services, projects, appointment' in line and 'sahaayata' not in line and 'addr' in line:
        cutline = i + 1   # keep up to and including this line
        break

if cutline:
    new_lines = lines[:cutline] + ['\n']
    with open('ai_service.py', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f'Cut at line {cutline}. Total lines now: {len(new_lines)}')
else:
    print('Cut line not found. Searching...')
    for i, line in enumerate(lines[370:], start=370):
        print(f'{i}: {line.rstrip()[:80]}')
