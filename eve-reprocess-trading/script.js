document.addEventListener('DOMContentLoaded', () => {
    const corpSelect = document.getElementById('corp_select');
    const factionDisplay = document.getElementById('faction_display');

    function safeParse(val) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }

    function applyEffectiveStanding(standing, skillType, connSkill, crimSkill, diploSkill) {
        if (standing === 0) return 0;
        if (standing < 0) {
            return standing + ((10 - standing) * 0.04 * diploSkill);
        } else {
            const skillLevel = (skillType === "Criminal Connections") ? crimSkill : connSkill;
            return standing + ((10 - standing) * 0.04 * skillLevel);
        }
    }

    function calcBrokerFee(skill, baseFaction, baseCorp) {
        return Math.max(0, 3 - (0.3 * skill) - (0.03 * baseFaction) - (0.02 * baseCorp));
    }

    function calcReprocessingTax(baseStanding, connectionsSkill) {
        if (baseStanding === 0) return 5.0;
        const rawEff = baseStanding + ((10 - baseStanding) * 0.04 * connectionsSkill);
        const eff = Math.round(rawEff * 100) / 100;
        if (eff <= 0) return 5.0;
        if (eff < 6.67) return +(0.05 * (1 - eff / 6.67)).toFixed(4) * 100;
        return 0;
    }

    function calcSalesTax(accountingSkill) {
        return 7.5 * (1 - (0.11 * accountingSkill));
    }

    function updateResults() {
        const accounting = safeParse(document.getElementById('skill_accounting').value);
        const broker = safeParse(document.getElementById('skill_broker').value);
        const conn = safeParse(document.getElementById('skill_connections').value);
        const crim = safeParse(document.getElementById('skill_criminal').value);
        const diplo = safeParse(document.getElementById('skill_diplomacy').value);
        const baseFaction = safeParse(document.getElementById('faction_standing').value);
        const baseCorp = safeParse(document.getElementById('corp_standing').value);
        const corp = corpSelect.value;

        const faction = EVE_DATA.corpToFaction[corp] || 'Caldari State';
        factionDisplay.textContent = faction;

        const factionEff = applyEffectiveStanding(baseFaction, 'Connections', conn, crim, diplo);
        const corpEff = applyEffectiveStanding(baseCorp, 'Connections', conn, crim, diplo);

        const brokerFee = calcBrokerFee(broker, baseFaction, baseCorp).toFixed(2);
        const reprocessingTax = calcReprocessingTax(baseCorp, conn).toFixed(2);
        const salesTax = calcSalesTax(accounting).toFixed(2);

        document.getElementById('derived_faction_standing').textContent = factionEff.toFixed(2);
        document.getElementById('derived_corp_standing').textContent = corpEff.toFixed(2);
        document.getElementById('broker_fee').textContent = `${brokerFee}%`;
        document.getElementById('reprocess_tax').textContent = `${reprocessingTax}%`;
        document.getElementById('sales_tax').textContent = `${salesTax}%`;

        const skillUsedFaction = (baseFaction < 0) ? 'Diplomacy' : 'Connections';
        const skillUsedCorp = (baseCorp < 0) ? 'Diplomacy' : 'Connections';

        document.getElementById('result_skills').innerHTML = `
            <div><strong>Skill Used (Faction)</strong><br><i>${skillUsedFaction}</i></div>
            <div><strong>Skill Used (Corp)</strong><br><i>${skillUsedCorp}</i></div>
        `;
    }

    // Populate corp dropdown
    EVE_DATA.corpList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        corpSelect.appendChild(option);
    });

    // Set default selection to "Caldari Navy"
    const defaultCorp = "Caldari Navy";
    const defaultIndex = [...corpSelect.options].findIndex(opt => opt.value === defaultCorp);
    if (defaultIndex !== -1) corpSelect.selectedIndex = defaultIndex;

    // Bind event listeners
    corpSelect.addEventListener('change', updateResults);
    document.querySelectorAll('select, input[type="number"]').forEach(el => {
        el.addEventListener('input', updateResults);
    });

    updateResults();
});
