(function main() {
  const obterElementos = function () {
    const formReceita = document.getElementById('form-adicionar-receita');
    const formDespesa = document.getElementById('form-adicionar-despesa');

    return {
      cabecalho: {
        saldo: document.getElementById('saldo'),
        principal: document.getElementById('progresso-principal'),
        categorias: document.getElementById('progresso-categoria'),
        visaoGeral: document.getElementById('visao-geral'),
      },
      receita: {
        tabela: document.getElementById('tabela-receitas'),
        form: formReceita,
        campos: {
          descricao: formReceita.querySelector('[name=descricao]'),
          valor: formReceita.querySelector('[name=valor]')
        }
      },
      despesa: {
        tabela: document.getElementById('tabela-despesas'),
        form: formDespesa,
        campos: {
          descricao: formDespesa.querySelector('[name=descricao]'),
          valor: formDespesa.querySelector('[name=valor]'),
          categoria: formDespesa.querySelector('[name=categoria]')
        }
      }
    }
  }

  const storeGenerica = function (chave) {
    return {
      listar: function () {
        const itens = localStorage.getItem(chave);

        if (!itens) {
          return [];
        }

        return JSON.parse(itens);
      },
      salvar: function (itens) {
        localStorage.setItem(chave, JSON.stringify(itens))
      }
    };
  }

  const despesasStore = storeGenerica('despesas');
  const receitasStore = storeGenerica('receitas');
   
  const elementos = obterElementos();

  const agrupar = function (itens, propriedade) {
    return itens.reduce(function (acumulador, item) {
      (acumulador[item[propriedade]] = acumulador[item[propriedade]] || []).push(item)
      return acumulador;
    }, {})
  }

  const padLeft = function (numero, quantidade, caracter) {
    return Array(quantidade - String(numero).length + 1).join(caracter || '0') + numero;
  }

  const formatarData = function (data) {
    let dataFormatada = data;
    if (typeof (data) == 'string') {
      dataFormatada = new Date(data)
    }

    return `${padLeft(dataFormatada.getDate(), 2)}/${padLeft(dataFormatada.getMonth(), 2)}`
  }

  const ordernarPorDataMaisRecente = function (a, b) {
    if (new Date(b) < new Date(a)) {
      return -1;
    }

    if (new Date(b) > new Date(a)) {
      return 1;
    }

    return 0;
  }

  const categorias = [
    {
      identificador: 'lazer',
      descricao: 'Lazer',
      previsto: 328
    },
    {
      identificador: 'alimentacao',
      descricao: 'Alimentação',
      previsto: 800
    },
    {
      identificador: 'moradia',
      descricao: 'Moradia',
      previsto: 700
    },
    {
      identificador: 'transporte',
      descricao: 'Transporte',
      previsto: 500
    }  
  ];
  const previstoDeReceitas = 4000;

  const criarOpcaoCategoria = function (categoria) {
    const elemento = document.createElement('option');
    elemento.innerHTML = categoria.descricao;
    elemento.value = categoria.identificador;
    return elemento;
  }
  const carregarSelectDeCategorias = function () {
    categorias.forEach(function (categoria) {
      elementos.despesa.form.categoria.appendChild(criarOpcaoCategoria(categoria));
    });
  }

  const renderizarReceita = function (receita) {
    return `<tr>
      <td class="coluna-descricao-transacao">
       ${receita.descricao}
       <p class="categoria-label">Receitas</p>
      </td>
      <td class="coluna-valor-transacao">
        ${accounting.formatMoney(receita.valor, "R$ ", 2, '.', ',')}
      </td>
    </tr>`;
  }
  const renderizarReceitas = function () {
    const receitasAgrupadas = agrupar(receitas, 'data');
    elementos.receita.tabela.innerHTML = "";
    Object.keys(receitasAgrupadas)
      .sort(ordernarPorDataMaisRecente)
      .forEach(function (grupo) {
        elementos.receita.tabela.innerHTML += `<tr>
            <td class="coluna-data" colspan="2">${formatarData(grupo)}</td>
        </tr>`;

        receitasAgrupadas[grupo].forEach(function (receita) {
          elementos.receita.tabela.innerHTML += renderizarReceita(receita);
        });
      });
  }

  const obterCategoria = function (identificador) {
    return categorias.find(function (categoria) {
      return categoria.identificador == identificador;
    });
 }
 const renderizarDespesa = function (despesa) {
  const descricaoCategoria = obterCategoria(despesa.categoria).descricao;      
    return `<tr>
        <td class="coluna-descricao-transacao">
        ${despesa.descricao}
        <p class="categoria-label">${descricaoCategoria}</p>
        </td>
        <td class="coluna-valor-transacao">
          ${accounting.formatMoney(despesa.valor, "R$ ", 2, '.', ',')}
        </td>
      </tr>`;
  }
  const renderizarDespesas = function () {
    const despesasAgrupadas = agrupar(despesas, 'data');
    elementos.despesa.tabela.innerHTML = "";
    Object.keys(despesasAgrupadas)
      .sort(ordernarPorDataMaisRecente)
      .forEach(function (grupo) {
        elementos.despesa.tabela.innerHTML += `<tr>
            <td class="coluna-data" colspan="2">${formatarData(grupo)}</td>
        </tr>`;

        despesasAgrupadas[grupo].forEach(function (despesa) {
          elementos.despesa.tabela.innerHTML += renderizarDespesa(despesa);
        });
      });
  }

  const calcularTotais = function(totais) {
    const totaisDespesas = despesas.reduce(function (acumulador, despesaAtual) {
      if (!acumulador.hasOwnProperty(despesaAtual.categoria)) {
        acumulador[despesaAtual.categoria] = 0;
      }

      acumulador[despesaAtual.categoria] += Number.parseFloat(despesaAtual.valor);
      acumulador.despesas += Number.parseFloat(despesaAtual.valor);
      console.log(acumulador);
      return acumulador;
    }, { despesas: 0 });
    
    const totalReceita = receitas.reduce(function (acumulador, receita) {
      acumulador += Number.parseFloat(receita.valor);
      return acumulador;
    }, 0);

    return Object.assign({
      receitas: totalReceita,
      total: totalReceita - totaisDespesas.despesas

    }, totaisDespesas);
  }
  
  const renderizarProgressoCategoria = function (categoria, totais){
    let totalCategoria = 0;

    if (totais.hasOwnProperty(categoria.identificador)) {
      totalCategoria = totais[categoria.identificador];
    }

    return `<div>
        <h5><span class="ofuscado">${categoria.descricao} ${accounting.formatMoney(totalCategoria, 'R$ ', 2, '.', ',')}</span></h5>
        <progress value="${totalCategoria}" max="${categoria.previsto}"></progress>
      </div>`
  }

  const renderizarColunaPrincipal = function(totais){
  const previstoDeDespesas = categorias.reduce(function (acumulador, categoria) {
    acumulador += categoria.previsto;
    return acumulador
  })

  elementos.cabecalho.principal.innerHTML = "";

  elementos.cabecalho.principal.innerHTML += renderizarProgressoCategoria({
    descricao: "Receitas",
    identificador: "receitas",
    previsto: previstoDeReceitas
  }, totais);

  elementos.cabecalho.principal.innerHTML += renderizarProgressoCategoria({
    descricao: "Despesas",
    identificador: "despesas",
    previsto: previstoDeDespesas
  }, totais);

}
  
const renderizarColunaCategorias = function(totais){
  elementos.cabecalho.categorias.innerHTML = "";
  categorias.forEach(function (categoria) {
    elementos.cabecalho.categorias.innerHTML += renderizarProgressoCategoria(categoria, totais);
  })
  }
  
  const renderizarItemVisaoGeral = function (item) {
    return `<div class="visao-geral-container">
    <h5><span class="ofuscado">${item.descricao}></span></h5>
    <span class="texto-grande">${accounting.formatMoney(item.valor, "R$ ", 2, '.', ',')}</span>
  </div>`
  }  
  
  const renderizarVisaoGeral = function(totais){
  elementos.cabecalho.visaoGeral.innerHTML = "";

  elementos.cabecalho.visaoGeral.innerHTML += renderizarItemVisaoGeral({
    descricao: "Receitas",
    valor: totais.receitas
  })

  elementos.cabecalho.visaoGeral.innerHTML += renderizarItemVisaoGeral({
    descricao: "Despesas",
    valor: totais.despesas
  })

  elementos.cabecalho.visaoGeral.innerHTML += renderizarItemVisaoGeral({
    descricao: "Economia",
    valor: totais.total
  })

}

const renderizarCabecalho = function () {
  const totais = calcularTotais();
    renderizarColunaPrincipal(totais);
    renderizarColunaCategorias(totais);
    renderizarVisaoGeral(totais);

    elementos.cabecalho.saldo.innerHTML = accounting.formatMoney(totais.total, 'R$ ', 2, '.', ',');
  }
 
  let receitas = receitasStore.listar();
  renderizarReceitas();
  let despesas = despesasStore.listar();
  renderizarDespesas();  
  carregarSelectDeCategorias();
  renderizarCabecalho();

  elementos.receita.form.onsubmit = function (event) {
    event.preventDefault();

    const receita = {
      data: new Date(new Date().setHours(0,0,0,0)).toString()
    }

    Object.keys(elementos.receita.campos).forEach(function (campo) {
      receita[campo] = elementos.receita.campos[campo].value;
    });

    receitas.push(receita);
    receitasStore.salvar(receitas);
    elementos.receita.form.reset();
    renderizarReceitas();
    renderizarCabecalho();

    console.log(receitas);

    // alert('Receita salva com sucesso!')
  }

  elementos.despesa.form.onsubmit = function (event) {
    event.preventDefault();

    const despesa = {
      data: new Date(new Date().setHours(0,0,0,0)).toString()
    }

    Object.keys(elementos.despesa.campos).forEach(function (campo) {
      despesa[campo] = elementos.despesa.campos[campo].value;
    });

    despesas.push(despesa);
    despesasStore.salvar(despesas);
    elementos.despesa.form.reset();
    renderizarDespesas();
    renderizarCabecalho();
    
    console.log(despesas);
    // alert('Despesa salva com sucesso!')
  }
})();