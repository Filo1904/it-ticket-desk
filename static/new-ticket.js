const ticketForm = document.getElementById("ticket-form");

ticketForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = ticketForm.querySelector('button[type="submit"]');
    //const feedback = document.getElementById("feedback");

    const newTicket = {
        name: document.getElementById("ticket-name").value,
        description: document.getElementById("ticket-description").value,
        priority: document.getElementById("ticket-priority").value
    };

    submitButton.disabled = true;
    //feedback.textContent = "Creazione ticket...";

    try {
        const response = await fetch("/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTicket)
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}`);
        }

        window.location.href = "/";
    } catch (error) {
        //feedback.textContent = "Impossibile creare il ticket.";
        console.error(error);
    } finally {
        submitButton.disabled = false;
    }
});