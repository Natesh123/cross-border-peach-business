import re

with open("app/styles/index.ts", "r") as f:
    lines = f.readlines()

new_lines = []
imported = False

for line in lines:
    if line.startswith("import { theme } from '../core/theme';") and not imported:
        new_lines.append(line)
        new_lines.append("import { scale, verticalScale, moderateScale } from '../helpers/responsive';\n")
        imported = True
        continue
    
    # Regex to find layout properties with pixel values (excluding %, 'auto')
    # e.g. padding: 10, margin: 10, height: 50, borderRadius: 20, width: 200
    # Match property names and number values
    props_scale = ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical', 
             'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
             'borderRadius', 'borderWidth', 'borderBottomWidth', 'borderTopWidth', 'borderLeftWidth', 'borderRightWidth',
             'top', 'bottom', 'left', 'right']
             
    props_vscale = ['height', 'minHeight', 'maxHeight']
    
    # We will exclude width replacement if it's '100%' or contains %
    # For width we use scale.
    props_wscale = ['width', 'minWidth', 'maxWidth']
    
    line_modified = line
    
    # Process scale props
    for prop in props_scale:
        # regex: prop: number, (allows space, handles negative numbers optionally)
        pattern = r'(' + prop + r'\s*:\s*)(-?\d+)(,|\s*$)'
        line_modified = re.sub(pattern, r'\1scale(\2)\3', line_modified)
        
    # Process verticalScale props
    for prop in props_vscale:
        pattern = r'(' + prop + r'\s*:\s*)(-?\d+)(,|\s*$)'
        line_modified = re.sub(pattern, r'\1verticalScale(\2)\3', line_modified)
        
    # Process width props
    for prop in props_wscale:
        pattern = r'(' + prop + r'\s*:\s*)(-?\d+)(,|\s*$)'
        line_modified = re.sub(pattern, r'\1scale(\2)\3', line_modified)

    # Some exceptions we might have broken:
    # If there's an issue we'll review manually.
    
    new_lines.append(line_modified)

with open("app/styles/index.ts", "w") as f:
    f.writelines(new_lines)
