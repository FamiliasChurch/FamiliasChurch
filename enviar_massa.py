import firebase_admin
from firebase_admin import credentials, messaging

# 1. Configurar acesso (mesma chave do backup)
cred = credentials.Certificate("chave-firebase.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

def enviar_para_todos():
    # 2. Ler os tokens do arquivo que você gerou
    try:
        with open("lista_de_tokens.txt", "r") as f:
            tokens = [linha.strip() for linha in f.readlines() if linha.strip()]
    except FileNotFoundError:
        print("❌ Arquivo 'lista_de_tokens.txt' não encontrado. Rode o script de backup primeiro.")
        return

    if not tokens:
        print("⚠️ A lista de tokens está vazia.")
        return

    # 3. Criar a mensagem
    mensagem = messaging.MulticastMessage(
        notification=messaging.Notification(
            title="📖 Alimento Diário Liberado!",
            body="Acesse agora a Famílias Church para ler a nova palavra.",
        ),
        tokens=tokens,
    )

    # 4. Enviar
    response = messaging.send_each_for_multicast(mensagem)
    
    print(f"✅ Sucesso: {response.success_count} mensagens enviadas.")
    print(f"❌ Falhas: {response.failure_count} (tokens antigos ou desativados).")

if __name__ == "__main__":
    enviar_para_todos()