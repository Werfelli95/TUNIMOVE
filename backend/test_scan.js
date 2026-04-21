const db = require('./config/db');

async function testScan() {
    const qr_code = '{"ligne":"6","ville_depart":"Rades","ville_arrivee":"ezzahra","date":"2026-04-20","heure":"08:00","siege":"A3"}';
    const inputCode = qr_code;
    
    try {
        let uniqueId = inputCode;
        let searchParams = null;

        if (typeof inputCode === 'string' && (inputCode.startsWith('{') || inputCode.startsWith('['))) {
            try {
                const parsed = JSON.parse(inputCode);
                if (parsed.code_ticket) uniqueId = parsed.code_ticket;
                else if (parsed.id_ticket) uniqueId = parsed.id_ticket;
                else searchParams = parsed;
            } catch (e) {}
        }

        let query = `
            SELECT 
                t.*,
                b.numero_bus,
                l.ville_depart as ligne_depart,
                l.ville_arrivee as ligne_arrivee
            FROM ticket t
            LEFT JOIN bus b ON t.id_bus = b.id_bus
            LEFT JOIN ligne l ON t.num_ligne::text = l.num_ligne::text
            WHERE 1=1
        `;
        let params = [];

        if (searchParams) {
            query += ` AND CAST(t.num_ligne AS TEXT) = $1 AND CAST(t.date_voyage AS TEXT) = $2 AND CAST(t.heure_depart AS TEXT) LIKE $3 AND t.siege = $4`;
            params = [String(searchParams.ligne), String(searchParams.date), String(searchParams.heure) + '%', String(searchParams.siege)];
        } else {
            query += ` AND (t.qr_code = $1 OR t.code_ticket = $1 OR CAST(t.id_ticket AS VARCHAR) = $1)`;
            params = [String(uniqueId)];
        }

        console.log("Query:", query);
        console.log("Params:", params);
        const result = await db.query(query + " LIMIT 1", params);
        console.log("Result rows:", result.rows.length);
        if (result.rows.length > 0) {
            console.log("Ticket found:", result.rows[0].id_ticket);
        } else {
            console.log("No ticket found");
        }
    } catch (err) {
        console.error("DATABASE ERROR:", err);
    } finally {
        process.exit();
    }
}

testScan();
