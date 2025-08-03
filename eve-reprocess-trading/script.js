document.addEventListener('DOMContentLoaded', () => {
    const hubSelect = document.getElementById('hub_select');
    const generateBtn = document.getElementById('generate_btn');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const tableWrapper = document.getElementById('price_table_wrapper');
    const regionHeader = document.getElementById('region_volume_header');
    const outputTableBody = document.querySelector('#output_price_table tbody');

    const hubToRegion = {
        jita: "The Forge",
        amarr: "Domain",
        rens: "Heimatar",
        hek: "Metropolis",
        dodixie: "Sinq Laison"
    };

    function safeParse(val) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }

    function updateResults() {
        const accounting = safeParse(document.getElementById('skill_accounting').value);
        const broker = safeParse(document.getElementById('skill_broker').value);
        const conn = safeParse(document.getElementById('skill_connections').value);
        const crim = safeParse(document.getElementById('skill_criminal').value);
        const diplo = safeParse(document.getElementById('skill_diplomacy').value);
        const scrap = safeParse(document.getElementById('skill_scrapmetal').value);

        const baseFaction = safeParse(document.getElementById('faction_standing_input').value);
        const baseCorp = safeParse(document.getElementById('corp_standing_input').value);

        const isPrivate = hubSelect.value === 'private';

        const factionEff = baseFaction < 0 ? baseFaction + ((10 - baseFaction) * 0.04 * diplo) : baseFaction + ((10 - baseFaction) * 0.04 * conn);
        const corpEff = baseCorp < 0 ? baseCorp + ((10 - baseCorp) * 0.04 * diplo) : baseCorp + ((10 - baseCorp) * 0.04 * conn);

        const brokerFee = isPrivate
            ? safeParse(document.getElementById('custom_brokerage_input').value)
            : Math.max(0, 3 - (0.3 * broker) - (0.03 * baseFaction) - (0.02 * baseCorp));

        const reprocessTax = isPrivate
            ? safeParse(document.getElementById('custom_tax_input').value)
            : corpEff <= 0 ? 5.0 : corpEff < 6.67 ? +(0.05 * (1 - corpEff / 6.67)).toFixed(4) * 100 : 0;

        const salesTax = 7.5 * (1 - (0.11 * accounting));
        const yieldPercent = 50 * (1 + 0.02 * scrap);

        document.getElementById('faction_standing_result').textContent = isPrivate ? '' : `Effective: ${factionEff.toFixed(2)}`;
        document.getElementById('corp_standing_result').textContent = isPrivate ? '' : `Effective: ${corpEff.toFixed(2)}`;

        document.getElementById('broker_fee').textContent = `${brokerFee.toFixed(2)}%`;
        document.getElementById('reprocess_tax').textContent = `${reprocessTax.toFixed(2)}%`;
        document.getElementById('sales_tax').textContent = `${salesTax.toFixed(2)}%`;
        document.getElementById('reprocess_yield').textContent = `${yieldPercent.toFixed(2)}%`;

        const resultSkills = document.getElementById('result_skills');
        resultSkills.style.display = isPrivate ? 'none' : 'block';
        if (!isPrivate) {
            resultSkills.innerHTML = `
                <div><strong>Skill Used (Faction)</strong><br><i>${baseFaction < 0 ? 'Diplomacy' : 'Connections'}</i></div>
                <div><strong>Skill Used (Corp)</strong><br><i>${baseCorp < 0 ? 'Diplomacy' : 'Connections'}</i></div>
            `;
        }
    }

    generateBtn.addEventListener('click', () => {
        generateBtn.disabled = true;
        generateBtn.textContent = "Loading...";

        const isPrivate = hubSelect.value === 'private';
        outputTableBody.innerHTML = '';

        if (isPrivate) {
            const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
            minerals.forEach(mineral => {
                const buyInput = document.querySelector(`.custom-buy[data-mineral='${mineral}']`);
                const sellInput = document.querySelector(`.custom-sell[data-mineral='${mineral}']`);
                const buy = safeParse(buyInput.value);
                const sell = safeParse(sellInput.value);

                outputTableBody.innerHTML += `
                    <tr>
                        <td>${mineral}</td>
                        <td>${buy.toFixed(2)}</td>
                        <td>${sell.toFixed(2)}</td>
                    </tr>`;
            });

            document.getElementById('region_volume_header').style.display = 'none';
        } else {
            fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hub: hubSelect.value,
                    includeSecondary: includeSecondarySelect.value === 'yes'
                })
            })
            .then(r => r.json())
            .then(data => {
                const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
                minerals.forEach(mineral => {
                    const buy = data.buy[mineral] || 0;
                    const sell = data.sell[mineral] || 0;
                    const volume = data.volumes[mineral] || 0;

                    outputTableBody.innerHTML += `
                        <tr>
                            <td>${mineral}</td>
                            <td>${buy.toFixed(2)}</td>
                            <td>${sell.toFixed(2)}</td>
                            <td>${Math.round(volume).toLocaleString()}</td>
                        </tr>`;
                });

                document.getElementById('region_volume_header').style.display = '';
            })
            .catch(err => console.error("Fetch error:", err));
        }

        tableWrapper.style.display = 'block';
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate";
    });

    hubSelect.addEventListener('change', () => {
        const isPrivate = hubSelect.value === 'private';
        document.getElementById('custom_prices_wrapper').style.display = isPrivate ? 'block' : 'none';
        document.getElementById('custom_brokerage_wrapper').style.display = isPrivate ? 'block' : 'none';
        document.getElementById('standing_inputs_wrapper').style.display = isPrivate ? 'none' : 'block';
        document.getElementById('secondary_toggle_wrapper').style.display = isPrivate ? 'none' : 'block';
        updateResults();
    });

    document.querySelectorAll('select, input[type="number"]').forEach(el => {
        el.addEventListener('input', updateResults);
    });

    updateResults();
});
