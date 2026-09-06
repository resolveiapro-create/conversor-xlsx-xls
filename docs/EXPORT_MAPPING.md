# Mapeamento do relatório oficial

O aplicativo parte do arquivo `assets/templates/relatorio_aceite.xlsx` e altera somente dados, resultados e desenhos necessários.

## Aba RELATÓRIO FOTOGRÁFICO ATIVAÇÃO

- Dados do cliente: `A5`, `A6`, `A7`, `A8`, `A9`.
- Dados da ativação: `D5`, `D6`, `D7`, `C8`, `D8`.
- Dados fixos: `C7`, `A11`, `E11`.
- Fotos gerais: `A14`, `C14`, `E14`, `A18`, `C18`, `E18`, `A22`, `C22`, `E22`.
- Fotos de equipamentos: `A26`, `C26`, `E26`, `A30`, `C30`, `E30`.
- Descrições: `A27`, `C27`, `E27`, `A31`, `C31`, `E31`.
- Identificadores: `A28`, `C28`, `E28`, `A32`, `C32`, `E32`.

## Aba RVO

- Imagem ancorada em `A1` e contida na área de 12,60 × 14,45 cm.

## Aba ATIVAÇÃO VOZ

- Originadas: `B3:B15`.
- Destinadas: `B17:B22`.

## Aba EQUIPAMENTOS MATERIAIS

- Equipamentos: linhas 3 a 8.
- O modelo original possuía apenas cinco linhas. O exportador insere a sexta linha e move Materiais para a linha 9.
- Quantidades dos materiais: `C11:C14` após a inserção.

## Imagens

Todas as imagens são convertidas para JPEG, reduzidas para no máximo 1600 px de largura e incorporadas no pacote XLSX. O arquivo final não depende dos caminhos do celular.
