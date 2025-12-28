import firebase_admin
from firebase_admin import credentials, firestore

# 1. Configurar o acesso com a chave que descarregou
cred = credentials.Certificate("chave-firebase.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def baixar_tokens():
    print("🔍 A aceder à coleção 'notificacoes_inscritos'...")
    
    # 2. Referência à sua coleção
    tokens_ref = db.collection("notificacoes_inscritos")
    docs = tokens_ref.stream()

    lista_tokens = []

    for doc in docs:
        dados = doc.to_dict()
        if 'token' in dados:
            lista_tokens.append(dados['token'])

    # 3. Guardar num ficheiro de texto
    if lista_tokens:
        with open("lista_de_tokens.txt", "w") as f:
            for token in lista_tokens:
                f.write(f"{token}\n")
        
        print(f"✅ Sucesso! {len(lista_tokens)} tokens foram guardados em 'lista_de_tokens.txt'.")
        print("💡 Agora basta copiar os tokens deste ficheiro para o Console do Firebase.")
    else:
        print("⚠️ Nenhuns tokens encontrados na coleção.")

if __name__ == "__main__":
    baixar_tokens()