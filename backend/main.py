import os
import json
import requests
import re
import fitz
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
from google.oauth2 import service_account
import firebase_admin
from firebase_admin import credentials, firestore

# Tenta pegar a credencial da variável de ambiente da Vercel
firebase_creds_env = os.environ.get("FIREBASE_CREDENTIALS")

try:
    if firebase_creds_env:
        creds_dict = json.loads(firebase_creds_env)
        google_creds = service_account.Credentials.from_service_account_info(creds_dict)
        cred = credentials.Certificate(creds_dict)
        print("☁️ Rodando na nuvem com Variáveis de Ambiente!")
    else:
        CHAVE_PATH = "chave-firebase.json"
        google_creds = service_account.Credentials.from_service_account_file(CHAVE_PATH)
        cred = credentials.Certificate(CHAVE_PATH)
        print("💻 Rodando localmente com arquivo JSON!")

    vision_client = vision.ImageAnnotatorClient(credentials=google_creds)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Motor operacional: Google Vision e Firebase conectados!")
except Exception as e:
    print(f"❌ Erro Crítico na conexão: {e}")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.familiaschurch.com.br", 
        "https://familias-church.vercel.app", # Link de preview da Vercel
        "http://localhost:5173"              # Para você continuar testando no seu PC
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extrair_dados_resgate(texto):
    print(f"\n--- 📄 ANALISANDO TEXTO BRUTO ---\n{texto}\n--------------------------------")
    texto_up = texto.upper().replace("\n", " ")

    # REGEX INTELIGENTE PARA VALORES:
    # 1. EXIGE que tenha "VALOR", "TOTAL" ou "R$" antes do número (Isso ignora o CPF, datas, etc.)
    # 2. Captura o número: \d+(?:[.,]\d+)? -> Pega "20", "267.80", "1.500,00", etc.
    # 3. (?![0-9\-]) -> Garante que o número acaba ali.
    v_match = re.search(r"(?:VALOR|TOTAL|R\$)\s*:?\s*(?:R\$)?\s*(\d+(?:[.,]\d+)?)(?![0-9\-])", texto_up)
    
    valor = 0.0
    if v_match:
        val_raw = v_match.group(1)
        
        # LOGICA DE PONTUAÇÃO (Sua ideia aplicada na prática):
        # Se tem vírgula E ponto (ex: 1.500,00 ou 1,500.00)
        if "," in val_raw and "." in val_raw:
            if val_raw.rfind(",") > val_raw.rfind("."):
                valor = float(val_raw.replace(".", "").replace(",", "."))
            else:
                valor = float(val_raw.replace(",", ""))
                
        # Se tem SÓ vírgula (ex: 20,00 ou 1,500)
        elif "," in val_raw:
            if len(val_raw.split(",")[-1]) == 2: # Tem 2 números depois da vírgula? É centavo.
                valor = float(val_raw.replace(",", "."))
            else: # Senão, é só separador de milhar.
                valor = float(val_raw.replace(",", ""))
                
        # Se tem SÓ ponto (ex: 267.80 ou 1.500)
        elif "." in val_raw:
            if len(val_raw.split(".")[-1]) == 2:
                valor = float(val_raw)
            else:
                valor = float(val_raw.replace(".", ""))
                
        # Se é um número inteiro seco (ex: "20")
        else:
            valor = float(val_raw)
    
    # Validação do CNPJ da Famílias Church (33.206.513/0001-02)
    texto_limpo = texto_up.replace("O", "0").replace("I", "1").replace("L", "1")
    confirmado = "33206513000102" in "".join(filter(str.isdigit, texto_limpo))
    
    print(f"💰 Valor Extraído com Sucesso: R$ {valor}")
    return confirmado, valor

@app.post("/validar-pix")
async def validar(request: Request):
    doc_id = None
    try:
        body = await request.json()
        payload = body.get("data", body)
        url, doc_id = payload.get("downloadUrl"), payload.get("registroId")

        res = requests.get(url, timeout=15)
        if res.status_code != 200: raise Exception(f"Download falhou: {res.status_code}")

        texto_ocr = ""
        if url.lower().split('?')[0].endswith(".pdf"):
            with fitz.open(stream=res.content, filetype="pdf") as doc:
                for page in doc: texto_ocr += page.get_text()
        else:
            res_v = vision_client.text_detection(image=vision.Image(content=res.content))
            texto_ocr = res_v.text_annotations[0].description if res_v.text_annotations else ""

        sucesso, valor_lido = extrair_dados_resgate(texto_ocr)

        if doc_id:
            try:
                if sucesso:
                    # Se for real, aprova e salva o valor
                    db.collection("registros_financeiros_validados").document(doc_id).update({
                        "status": "Aprovado",
                        "valorLido": valor_lido,
                        "ocrRaw": texto_ocr[:1000] 
                    })
                    print("✅ Comprovante Aprovado e salvo!")
                else:
                    # Se for fake/rejeitado, APAGA da existência
                    db.collection("registros_financeiros_validados").document(doc_id).delete()
                    print("🗑️ Comprovante Rejeitado. Registro apagado do banco.")
            except Exception as fire_err:
                print(f"❌ Erro Firestore: {fire_err}")

        return {"data": {"success": sucesso, "valor": valor_lido}}

    except Exception as e:
        print(f"❌ Erro Geral: {e}")
        return {"data": {"success": False, "error": str(e)}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)