console.log('XP Helper working...');

function formatMoney( value ) {
    return value.replace('R$', '').replace('.', '').replace(',', '.').trim();
}

function formatPercentage( value ) {
    return parseFloat( value.replace('%', '').replace(',', '.').trim() ) / 100;
}

function isVisible( element ) {
    var style = window.getComputedStyle( element );
    return (style.display !== 'none')
}

const onMessage = async (message, sender, sendResponse) => {

    if (message.urlPath === '/emissao-bancaria/#/home') {
        await clearAtivosDisponiveisPage();
    }

    if (message.urlPath === '/emissao-bancaria/#/investimentos') {
        await addMeusInvestimentosExportToCsv();
    } else {
        await removeMeusInvestimentosExportToCsv();
    }

    await clearDisclaimerIfAvailable();
}

const clearAtivosDisponiveisPage = async () => {

    // Wait until the elements are inserted into the DOM
    while ( document.getElementsByClassName('hero').length === 0 || document.getElementsByClassName('recommendation').length === 0 ) {
        await new Promise(r => setTimeout(r, 1000));
    }

    const hero = document.getElementsByClassName('hero');
    const recommendations = document.getElementsByClassName('recommendation');

    if (hero.length > 0) {
        for (let i = 0; i < hero.length; i++) {
            let e = hero[i];
            e.remove();
         }
    } 

    if (recommendations.length > 0) {
        for (let i = 0; i < recommendations.length; i++) {
            let e = recommendations[i];
            e.remove();
         }
    }

}

const addMeusInvestimentosExportToCsv = async () => {

    // Wait until the elements are inserted into the DOM
    while ( document.getElementsByClassName('table__row').length === 0 ) {
        await new Promise(r => setTimeout(r, 1000));
    }

    const rows = document.getElementsByClassName('table__row');

    const investimentos = [
        [
            'Ativo',
            'Vencimento',
            'Rentabilidade (a.a.)',
            'Aplicado em',
            'Aplicação',
            'Juros/Amortização',
            'Valor total',
            'Rendimento',
            'Retorno'
        ]
    ];

    for (const row of rows) {

        // 0: Nome
        const nome = row.querySelectorAll('.name-row')[0].innerText;

        // 1: Vencimento
        const vencimento = row.childNodes[1].innerText;

        // 2: Rentabilidade (a.a.)
        const rentabilidade = row.childNodes[2].innerText;

        // 3: Data de aplicação
        const dataAplicacao = row.childNodes[3].innerText;

        // 4. Valor investido
        const valorInvestido = formatMoney(row.childNodes[4].innerText);

        // 5. Juros/Amortização em R$
        const jurosAmortizacao = row.childNodes[5].innerText === '-'
            ? 0
            : formatMoney(row.childNodes[5].innerText);

        // 6. Posição total em R$
        const valorTotalAtual = formatMoney(row.childNodes[6].innerText);

        // 7. Rendimento em R$
        const rendimento = formatMoney(row.childNodes[7].innerText);

        // 8. Retorno
        const retorno = formatPercentage( row.childNodes[8].innerText );

        investimentos.push(
            nome + ',' +
            vencimento + ',' +
            rentabilidade + ',' +
            dataAplicacao + ',' +
            valorInvestido + ',' +
            jurosAmortizacao + ',' +
            valorTotalAtual + ',' +
            rendimento + ',' +
            retorno
        );

    }

    csvInvestimentos = investimentos.join('\n');


    const blob = new Blob([csvInvestimentos], { type: 'text/csv;charset=utf-8,' })

    await chrome.runtime.sendMessage({
        action: 'storeData',
        key: 'investimentosCsv',
        data: blob,
    });

    const curDate = new Date();

    const fileName = 'Investimentos em ' + curDate.getFullYear() + '-' + ('0' + (curDate.getMonth() + 1)).slice(-2) + '-' + ('0' + curDate.getDate()).slice(-2) + '.csv';

    const objUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', objUrl);
    link.setAttribute('download', fileName);
    link.style.position = 'fixed';
    link.style.bottom = '70px';
    link.style.border = '1px solid black';
    link.style.borderLeft = '0';
    link.style.backgroundColor = 'white';
    link.style.borderTopRightRadius = '5px';
    link.style.borderBottomRightRadius = '5px';
    link.style.color = 'black';
    link.style.padding = '5px';
    link.style.paddingRight = '7px';
    link.style.left = 0;
    link.style.fontSize = '12px';
    link.style.boxShadow = '0 0 8px #888888';
    link.textContent = 'Exportar para CSV';
    link.id = 'LinkMeusInvestimentosExportToCsv';
    
    document.querySelector('body').append(link);

}

const removeMeusInvestimentosExportToCsv = async () => {
    
    if ( document.getElementById('LinkMeusInvestimentosExportToCsv') ) {
       document.getElementById('LinkMeusInvestimentosExportToCsv').remove();
    }

}

const clearDisclaimerIfAvailable = async () => {

    const maxTries = 5;
    let currentTry = 1;

    // Wait until the elements are inserted into the DOM
    while ( document.getElementsByClassName('disclaimerWrapper').length === 0 && currentTry <= maxTries) {
        await new Promise(r => setTimeout(r, 1000));

        currentTry++;
    }

    const disclaimer = document.getElementsByClassName('disclaimerWrapper');

    if (disclaimer.length > 0) {
        for (let i = 0; i < disclaimer.length; i++) {
            let e = disclaimer[i];
            e.remove();
         }
    }

}

// Event listeners (Sould always be placed in the end of the script)
chrome.runtime.onMessage.addListener(onMessage);
