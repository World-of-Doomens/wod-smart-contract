async function main() {
    const WoD = await ethers.getContractFactory("WoD");
    const rootHash = "0xae44e08a46a69243ec324263f1f1744dc2ab1f27727271cbedf8063a75759c49";
    const wod = await WoD.deploy(rootHash, "TOKEN URI");
  
    console.log("WoD deployed to:", wod.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });