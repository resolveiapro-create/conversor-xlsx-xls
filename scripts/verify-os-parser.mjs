import assert from 'node:assert/strict';

import { parseEmbratelOsText } from '../src/services/osTextParser.ts';

const fixture = `
Relatório de Agendamento
Item: 1234567
CLIENTE
DATA/HORA COMBINADA COM O CLIENTE
CLIENTE MODELO LTDA
30/08/2026 - 09:00
CONTATO LOCAL DO CLIENTE
TELEFONE DO CONTATO LOCAL DO CLIENTE
ATIVIDADE
DESIGNAÇÃO
Alteração de Facilidade
MGA/VL/4440012345
ENDEREÇO
NÚMERO
COMPLEMENTO
Avenida Exemplo
572
SALA 14
BAIRRO
CIDADE
UF
FONE
Centro
Maringa
PR
(44) 9812-0773
COD. CIR 1
DESIGNAÇÃO
ORDER ENTRY
OTS
2556427
MGA/VL/4440012345
NA
NA
SERVIÇO
AÇÃO
TECNOLOGIA
VELOCIDADE
VIPLINE+VIPNET
Alterar
BSOD
2M
DETALHES DO AGENDAMENTO:
Contato cliente: Suelen / Telefone: 44 9812-0773 / E-mail: exemplo@cliente.com.br
Contato que vai validar: Suelen / Telefone: 44 9812-0773 / E-mail: exemplo@cliente.com.br
`;

const expected = {
  client: 'CLIENTE MODELO LTDA',
  itemWf: '1234567',
  address: 'Avenida Exemplo, 572 - SALA 14',
  circuitCode: '2556427',
  city: 'Maringa',
  speed: '2M',
  contact: 'Suelen',
  designation: 'MGA/VL/4440012345',
  phone: '(44) 9812-0773',
  accessType: 'BSOD',
  activity: 'Alteração de Facilidade',
  date: '30/08/2026',
  validatedBy: 'Suelen',
};

assert.deepEqual(parseEmbratelOsText(fixture), expected);

const compactFixture = fixture
  .replace('Relatório de Agendamento\nItem: 1234567', 'Relatório de AgendamentoItem: 1234567')
  .replace('CLIENTE\nDATA/HORA COMBINADA COM O CLIENTE\nCLIENTE MODELO LTDA\n30/08/2026 - 09:00', 'CLIENTE DATA/HORA COMBINADA COM O CLIENTE\nCLIENTE MODELO LTDA 30/08/2026 - 09:00')
  .replace('ATIVIDADE\nDESIGNAÇÃO\nAlteração de Facilidade\nMGA/VL/4440012345', 'ATIVIDADE DESIGNAÇÃO\nAlteração de Facilidade MGA/VL/4440012345')
  .replace('ENDEREÇO\nNÚMERO\nCOMPLEMENTO\nAvenida Exemplo\n572\nSALA 14', 'ENDEREÇO NÚMERO COMPLEMENTO\nAvenida Exemplo 572 SALA 14')
  .replace('BAIRRO\nCIDADE\nUF\nFONE\nCentro\nMaringa\nPR\n(44) 9812-0773', 'BAIRRO CIDADE UF FONE\nCentro Maringa PR (44) 9812-0773');

assert.deepEqual(parseEmbratelOsText(compactFixture), expected);

console.log('Leitor do PDF de OS verificado com sucesso.');
