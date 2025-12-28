import firebase_admin
from firebase_admin import credentials, messaging
import os
import webbrowser # Nova biblioteca para abrir o site

# Configuração de acesso
if not firebase_admin._apps:
    cred = credentials.Certificate("chave-firebase.json")
    firebase_admin.initialize_app(cred)

def enviar_notificacao(titulo, corpo):
    # Carrega os tokens salvos pelo App.tsx
    try:
        with open("lista_de_tokens.txt", "r") as f:
            tokens = [linha.strip() for linha in f.readlines() if linha.strip()]
    except FileNotFoundError:
        print("\n❌ Erro: Arquivo 'lista_de_tokens.txt' não existe.")
        return

    if not tokens:
        print("\n⚠️ Lista de membros vazia.")
        return

    # Monta a mensagem para disparo em massa
    mensagem = messaging.MulticastMessage(
        notification=messaging.Notification(
            title=titulo,
            body=corpo,
        ),
        tokens=tokens,
    )

    print(f"\n🚀 Enviando para {len(tokens)} membros...")
    response = messaging.send_each_for_multicast(mensagem)
    
    print(f"✅ Sucesso: {response.success_count} enviados.")
    
    # ABRE O SITE AUTOMATICAMENTE
    print("\n🌍 Abrindo o site Famílias Church para conferência...")
    webbrowser.open('http://localhost:5173/devocionais') 

def menu():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("="*40)
        print("   ⛪ PAINEL FAMÍLIAS CHURCH")
        print("="*40)
        print("1. 📢 Enviar Notificação e Abrir Site")
        print("0. 🚪 Sair")
        print("-"*40)
        
        opcao = input("Escolha uma opção: ")

        if opcao == "1":
            titulo = input("\nTítulo: ")
            corpo = input("Mensagem: ")
            enviar_notificacao(titulo, corpo)
            input("\nPressione Enter para voltar ao menu...")
        elif opcao == "0":
            break

if __name__ == "__main__":
    menu()