const { SparseTextEmbedding, SparseEmbeddingModel } = require("fastembed");

async function main() {
  await SparseTextEmbedding.init({
    model: SparseEmbeddingModel.SpladePPEnV1,
  });

  console.log("Modelo descargado");
}

main();
