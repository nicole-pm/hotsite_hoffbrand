import zipfile
import xml.etree.ElementTree as ET

def get_docx_formatted_text(path):
    document = zipfile.ZipFile(path)
    xml_content = document.read('word/document.xml')
    document.close()
    tree = ET.fromstring(xml_content)
    
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for paragraph in tree.findall('.//w:p', ns):
        p_text = []
        for run in paragraph.findall('.//w:r', ns):
            rPr = run.find('w:rPr', ns)
            is_bold = False
            color = None
            highlight = None
            
            if rPr is not None:
                if rPr.find('w:b', ns) is not None:
                    is_bold = True
                color_tag = rPr.find('w:color', ns)
                if color_tag is not None:
                    color = color_tag.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                highlight_tag = rPr.find('w:highlight', ns)
                if highlight_tag is not None:
                    highlight = highlight_tag.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
            
            t = run.find('w:t', ns)
            if t is not None and t.text:
                text = t.text
                if is_bold:
                    text = f"**{text}**"
                if color:
                    text = f"{{COLOR:{color}}}{text}{{/COLOR}}"
                if highlight:
                    text = f"{{HL:{highlight}}}{text}{{/HL}}"
                p_text.append(text)
        
        if p_text:
            paragraphs.append("".join(p_text))
    
    return "\n".join(paragraphs)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        print(get_docx_formatted_text(sys.argv[1]))
