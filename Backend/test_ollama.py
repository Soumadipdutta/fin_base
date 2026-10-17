
from app.services.ollama_service import get_chat_model


def main():
    model = get_chat_model()

    response = model.invoke(
        "Explain cash-flow risk in a small SaaS company "
        "in three concise bullet points."
    )

    print(response.content)


if __name__ == "__main__":
    main()
