async function loadTickets() {
    const feedback = document.getElementById("feedback");
    feedback.textContent = "Caricamento ticket...";
    try {
        
        const search = document.getElementById("filter-search").value.trim()
        const status = document.getElementById("filter-status").value;
        const priority = document.getElementById("filter-priority").value;

        const params = new URLSearchParams();
        if (search !== "") {
            params.set("search", search)
        }
        if (status !== "") {
            params.set("status", status)
        }
        if (priority !== "") {
            params.set("priority", priority)
        }
        

        const response = await fetch(`/tickets?${params}`);

        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}`);
        }

        const tickets = await response.json();
        console.log(tickets);

        const container = document.getElementById("ticket-list");
        container.replaceChildren();
        
        if (tickets.length === 0) {
            feedback.textContent = "Nessun ticket trovato con i filtri selezionati."
            return
        }

        tickets.forEach(ticket => {

            const card = document.createElement("article");
            card.className = "ticket-card";

            const paragraph = document.createElement("p");
            let createdAtText = "Data non disponibile"
            
            if (ticket["created_at"])
                createdAtText = new Date(ticket.created_at).toLocaleString("it-IT", {
                    timeZone: "Europe/Rome"
                })

            paragraph.textContent = `Nome: ${ticket["name"]} | Stato: ${ticket["status"]} | Priorità: ${ticket["priority"]} | Data e ora: ${createdAtText}`       

            card.appendChild(paragraph)

            const ticketDescription = document.createElement("p");
            ticketDescription.textContent = ticket["description"];
            card.appendChild(ticketDescription);
            
            if (ticket["status"] !== "risolto") {
                const statusButton = document.createElement("button")
                statusButton.type = "button"
                statusButton.textContent = ticket["status"] === "aperto" ? "Prendi in carico" : "Segna come risolto"

                statusButton.addEventListener("click", async function () {
                    const newStatus = ticket["status"] === "aperto" ? "in lavorazione" : "risolto"
                    try {
                        statusButton.disabled = true
                        const response = await fetch(`/tickets/${ticket.id}`, {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ status: newStatus })
                        });
                        if (!response.ok) {
                            throw new Error(`Errore HTTP ${response.status}`);
                        }
                        await loadTickets();
                    } catch (error)
                    {
                        console.error(error);
                        feedback.textContent = "Impossibile aggiornare lo stato.";
                    } finally {
                        statusButton.disabled = false
                    }
                });

                card.appendChild(statusButton);
            }
            container.appendChild(card);
        });

        feedback.textContent = "Ticket caricati";
    }catch (error) {
        feedback.textContent = "Impossibile caricare i ticket.";
        console.error(error);        
    }
}

loadTickets();



const searchFilter = document.getElementById("filter-search");
let searchTimeout;

searchFilter.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadTickets, 300);
});

const statusFilter = document.getElementById("filter-status");
statusFilter.addEventListener("change", loadTickets);
const priorityFilter = document.getElementById("filter-priority");
priorityFilter.addEventListener("change", loadTickets);

const refreshButton = document.getElementById("refresh-tickets")
refreshButton.addEventListener("click", loadTickets);

const ticketForm = document.getElementById("ticket-form");

ticketForm.addEventListener("submit", async function (event) {
    event.preventDefault();


    const submitButton = ticketForm.querySelector('button[type="submit"]');
    const feedback = document.getElementById("feedback");
    const newTicket = {
        name: document.getElementById("ticket-name").value,
        description: document.getElementById("ticket-description").value,
        priority: document.getElementById("ticket-priority").value
    };

    submitButton.disabled = true;

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
        
        const createdTicket = await response.json();
        console.log(createdTicket);

        ticketForm.reset();
        await loadTickets();

    } catch (error) {
        feedback.textContent = "Impossibile creare il ticket.";
        console.error(error);         
    } finally {
        submitButton.disabled = false;
    }
    
});

