import re

with open("app/screens/home/Home.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
imported = False

for line in lines:
    if line.startswith("import { RFValue } from \"react-native-responsive-fontsize\";") and not imported:
        new_lines.append(line)
        new_lines.append("import { scale, verticalScale, moderateScale } from '../../helpers/responsive';\n")
        imported = True
        continue
    
    # Regex to find layout properties with pixel values (excluding %, 'auto')
    props_scale = ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical', 
             'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
             'borderRadius', 'borderWidth', 'borderBottomWidth', 'borderTopWidth', 'borderLeftWidth', 'borderRightWidth',
             'top', 'bottom', 'left', 'right', 'gap']
             
    props_vscale = ['height', 'minHeight', 'maxHeight']
    props_wscale = ['width', 'minWidth', 'maxWidth']
    
    line_modified = line
    
    # Process scale props
    for prop in props_scale:
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

    new_lines.append(line_modified)

with open("app/screens/home/Home.tsx", "w") as f:
    f.writelines(new_lines)
