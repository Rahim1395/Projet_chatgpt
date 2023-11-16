const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/traiterFormulaire', async (req, res) => {
    try {
        const { nom, prenom, email, recherche } = req.body;

        // Lecture du fichier JSON
        const fichierDonneesPath = path.join(__dirname, 'donneesReponses.json');
        let donneesReponses = [];

        try {
            const fileContent = await fs.readFile(fichierDonneesPath, 'utf-8');
            donneesReponses = JSON.parse(fileContent);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Erreur lors de la lecture du fichier donneesReponses.json:', error);
            }
        }

        // Appel à l'API de ChatGPT avec Axios (utilise ta clé d'API)
        const chatGPTApiKey = process.env.CHATGPT_API_KEY;
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        let reponseChatGPT = '';

        try {
            const response = await axios.post(apiUrl, {
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: recherche }],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${chatGPTApiKey}`,
                },
            });

            reponseChatGPT = response.data.choices[0].message.content;
        } catch (error) {
            // En cas d'erreur avec ChatGPT, tu peux laisser la réponse vide
            console.error('Erreur lors de la requête à l\'API de ChatGPT:', error);
        }

        // Enregistrement des données dans la structure
        const nouvelleEntree = { nom, prenom, email, recherche, reponseChatGPT };
        donneesReponses.push(nouvelleEntree);

        // Écriture de la structure dans le fichier JSON
        await fs.writeFile(fichierDonneesPath, JSON.stringify(donneesReponses, null, 2));

        // Envoyer la réponse au client
        res.json({ message: 'Formulaire traité avec succès!', reponseChatGPT });

    } catch (error) {
        console.error('Erreur lors du traitement du formulaire:', error);
        res.status(500).json({ error: 'Erreur lors du traitement du formulaire.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
