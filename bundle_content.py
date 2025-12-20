import os
import json
import sys # Importe o módulo sys

def bundle_json_files(folder_path, output_name):
    bundled_data = []
    try:
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Pasta não encontrada: {folder_path}")

        files = [f for f in os.listdir(folder_path) if f.endswith('.json') and f != 'index.json']
        
        for file_name in files:
            file_path = os.path.join(folder_path, file_name)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                content['id'] = file_name
                bundled_data.append(content)

        output_path = f"content/{output_name}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bundled_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {output_name} gerado.")

    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        sys.exit(1) # Força o Netlify a interromper o build e te avisar

if __name__ == "__main__":
    bundle_json_files('content/eventos', 'eventos_all')
    bundle_json_files('content/publicacoes/devocionais', 'devocionais_all')
    bundle_json_files('content/publicacoes/estudos', 'estudos_all')