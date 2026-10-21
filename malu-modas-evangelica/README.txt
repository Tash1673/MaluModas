MALU MODAS EVANGÉLICA — SITE ATUALIZADO

1. CONFIGURE A LOJA
Abra config.js no Bloco de Notas e preencha os valores entre aspas:
  whatsapp: número real com DDD (ou 55 + DDD + número), apenas dígitos.
  instagram: nome de usuário, sem @, não o link completo.
  endereco: endereço completo da loja.
WhatsApp configurado: 5565993306438. Instagram: @malumodasevangelicas. Endereço preenchido conforme informado pela loja.
Sem número válido, o site mostra um aviso e permite copiar a seleção; não envia pedidos.
Endereço e Instagram vazios ficam ocultos. Não foram inventados contatos.

2. EDITE O CATÁLOGO
produtos.js contém 15 exemplos: 9 femininos, 4 masculinos e 2 infantis.
Troque exemplos, fotos, tamanhos, cores, disponibilidade e preços por informações reais.
Coloque as fotos em assets/pecas e indique o caminho em imagem.
preco: null mostra “Valor sob consulta”. Use ponto decimal em valores, sem R$.
setor: Feminino, Masculino ou Infantil. categoria: tipo da peça (Ternos, Camisas etc.).
Preserve IDs únicos; não reutilize IDs de peças removidas para produtos diferentes.
Somente depois de substituir os exemplos, mude demonstracao para false em config.js.
A sacola é salva apenas no navegador. Pagamento e disponibilidade são combinados pelo WhatsApp.

3. PUBLIQUE NO NETLIFY
Extraia o ZIP. Entre na sua conta Netlify e acesse https://app.netlify.com/drop.
Arraste a pasta malu-modas-evangelica (a pasta que contém index.html) para a área de publicação.
Este site estático não precisa de instalação nem comando de compilação.
Para atualizar um site existente, abra o projeto no Netlify, vá a Deploys e arraste a pasta atualizada na área de deploy manual.
Guia oficial: https://docs.netlify.com/deploy/create-deploys/

4. CONFIRA ANTES DE DIVULGAR
Abra o site no celular, teste filtros, detalhes, sacola e o destino do WhatsApp.
Confirme seus contatos e substitua os exemplos de produtos.
Fontes Google são opcionais; sem conexão, o site usa fontes locais.
Logo original preservada em assets/logo.png. Paleta: preto, dourado e verde.

