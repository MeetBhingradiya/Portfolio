import sys
import json

def add_or_update_comment(file_path, comment):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        if content.startswith('/**'):
            closing_index = content.find('*/') + 2
            content_after_comment = content[closing_index:].lstrip('\n')
            updated_content = f"{comment}\n{content_after_comment}"
        else:
            updated_content = f"{comment}\n{content}"

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)

        return {"status": "success", "file": file_path}
    except Exception as e:
        return {"status": "error", "file": file_path, "error": str(e)}

def main():
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    file_path = data['file_path']
    comment = data['comment']

    result = add_or_update_comment(file_path, comment)
    print(json.dumps(result))
    
main()