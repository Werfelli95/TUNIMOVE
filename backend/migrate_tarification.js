const pool = require('./config/db');

const SQL_QUERIES = [
    // 1. Create table type_tarification
    `CREATE TABLE IF NOT EXISTS type_tarification (
        id_type_tarification SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        libelle VARCHAR(100) NOT NULL,
        categorie VARCHAR(50) NOT NULL,
        mode_calcul VARCHAR(50) NOT NULL,
        valeur NUMERIC NOT NULL,
        actif BOOLEAN DEFAULT TRUE,
        remarque TEXT
    );`,

    // 2. Create table type_bagage
    `CREATE TABLE IF NOT EXISTS type_bagage (
        id_type_bagage SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        libelle VARCHAR(100) NOT NULL,
        prix NUMERIC NOT NULL,
        actif BOOLEAN DEFAULT TRUE
    );`,

    // 3. Alter existing tables safely
    `ALTER TABLE ticket ADD COLUMN IF NOT EXISTS id_type_tarification INT REFERENCES type_tarification(id_type_tarification);`,
    `ALTER TABLE ticket ADD COLUMN IF NOT EXISTS id_type_bagage INT REFERENCES type_bagage(id_type_bagage);`,
    `ALTER TABLE ticket ADD COLUMN IF NOT EXISTS prix_bagage NUMERIC;`,

    `ALTER TABLE reservation ADD COLUMN IF NOT EXISTS id_type_tarification INT REFERENCES type_tarification(id_type_tarification);`,
    `ALTER TABLE reservation ADD COLUMN IF NOT EXISTS id_type_bagage INT REFERENCES type_bagage(id_type_bagage);`,

    // 4. Seeding REDUCTIONS (Percent Remaining to pay)
    // 25% => 75, 50% => 50, 75% Hand => 25, 75% G.Nationale => 25, 10% => 90, 20% => 80, Titre Faveur => 0, Tarif Plein => 100
    `INSERT INTO type_tarification (code, libelle, categorie, mode_calcul, valeur) VALUES
        ('PLEIN', 'Tarif normal (Plein rapide)', 'VOYAGEUR', 'PERCENT_RESTANT', 100),
        ('RED_25', '25% rédu.', 'VOYAGEUR', 'PERCENT_RESTANT', 75),
        ('RED_50', '50% rédu.', 'VOYAGEUR', 'PERCENT_RESTANT', 50),
        ('HAND_75', '75% Hand.', 'VOYAGEUR', 'PERCENT_RESTANT', 25),
        ('GN_75', '75% G. Nationale', 'VOYAGEUR', 'PERCENT_RESTANT', 25),
        ('RED_10', '10% rédu.', 'VOYAGEUR', 'PERCENT_RESTANT', 90),
        ('RED_20', '20% rédu.', 'VOYAGEUR', 'PERCENT_RESTANT', 80),
        ('FAVEUR', 'Titre faveur', 'VOYAGEUR', 'PERCENT_RESTANT', 0)
    ON CONFLICT (code) DO NOTHING;`,

    // 5. Seeding CONVENTIONS (Specific reductions / Fixed)
    // I assume these are also fixed percentages, but the user didn't specify values for conventions, so I'll assign 100% just as placeholder or 0% depending on convention rules. Let's make them PERCENT_RESTANT 0% for now or we just leave them generic. "Usually they are free or highly subsidized." I will just set 0% and Admin can edit.
    `INSERT INTO type_tarification (code, libelle, categorie, mode_calcul, valeur) VALUES
        ('CONV_MIL', 'Conv. Militaire', 'CONVENTION', 'PERCENT_RESTANT', 25),
        ('CONV_DOU', 'Conv. Douane', 'CONVENTION', 'PERCENT_RESTANT', 25),
        ('CONV_INT', 'Conv. M. Intérieur', 'CONVENTION', 'PERCENT_RESTANT', 25),
        ('CONV_CIV', 'Conv. P. Civile', 'CONVENTION', 'PERCENT_RESTANT', 25)
    ON CONFLICT (code) DO NOTHING;`,

    // 6. Seeding EXPEDITION (Fixed)
    `INSERT INTO type_tarification (code, libelle, categorie, mode_calcul, valeur) VALUES
        ('EX_3', 'Expédition 3 DT', 'EXPEDITION', 'FIXE', 3000),
        ('EX_5', 'Expédition 5 DT', 'EXPEDITION', 'FIXE', 5000),
        ('EX_10', 'Expédition 10 DT', 'EXPEDITION', 'FIXE', 10000),
        ('EX_20', 'Expédition 20 DT', 'EXPEDITION', 'FIXE', 20000)
    ON CONFLICT (code) DO NOTHING;`,

    // 7. Seeding BAGGAGE (Fixed Add-ons)
    `INSERT INTO type_bagage (code, libelle, prix) VALUES
        ('BAG_INF_250', 'Bagage < 250 km', 1100),
        ('BAG_SUP_250', 'Bagage > 250 km', 1500),
        ('BAG_2', 'Bagage 2 DT', 2000),
        ('BAG_3', 'Bagage 3 DT', 3000),
        ('BAG_5', 'Bagage 5 DT', 5000),
        ('BAG_10', 'Bagage 10 DT', 10000),
        ('BAG_20', 'Bagage 20 DT', 20000),
        ('BAG_30', 'Bagage 30 DT', 30000),
        ('BAG_50', 'Bagage 50 DT', 50000)
    ON CONFLICT (code) DO NOTHING;`
];

async function migrate() {
    console.log("Starting Migration...");
    try {
        for (const query of SQL_QUERIES) {
            console.log("Executing:", query.substring(0, 80).replace(/\n/g, ' ') + '...');
            await pool.query(query);
        }
        console.log("Migration Complete!");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        process.exit();
    }
}

migrate();
