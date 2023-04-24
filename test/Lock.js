const { expect } = require("chai");
const { ethers } = require("hardhat");
const UNIabi = require("./Unirouter.json");
var deployer, testAC1, testAC2, testAC3, testAC4, testAC5, testAC6, testAC7,testAC8;
var deployer_, testAC1_, testAC2_, testAC3_, testAC4_, testAC5_, testAC6_, testAC7_,testAC8_;

var factoryABI= require("../artifacts/contracts/FreshSwapFactoryInterface.sol/factoryMethod.json");
var poolABI= require("../artifacts/contracts/pool.sol/pool.json");
var ibep20ABI = require("../artifacts/contracts/testToken.sol/FSBEP20.json");
var tokenABI = require("../artifacts/contracts/USD.sol/USD.json");
var taxHandlerABI = require("../artifacts/contracts/FreshSwapContractFactory.sol/TaxHandler.json");
var autlpABI = require("../artifacts/contracts/tokenwithburntax copy.sol/LP.json");
var AUTO;
const { Test, test } = require("mocha");
const { extendEnvironment } = require("hardhat/config");

var UNI;
var BURN;
var USD,TestToken,Factory,Pool;
var TokenCreator,Tokenaddress;
var accounts =[deployer, testAC1, testAC2, testAC3, testAC4, testAC5, testAC6, testAC7,testAC8];
let num = ethers.utils.parseUnits("100000000", 18)
var USD2;
var stake;
console.log(num)
describe("FreshSwap Tests", async ()=> {
  before(async ()=>{
    accounts =  [deployer, testAC1, testAC2, testAC3, testAC4, testAC5, testAC6, testAC7,testAC8] = await ethers.getSigners();
    USD = await ethers.getContractFactory("USD");
    USD= await USD.deploy();
    USD2= await ethers.getContractFactory("USD");
    USD2= await USD2.deploy();
    //USD= new ethers.Contract("0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",ibep20ABI.abi,ethers.provider);
    BURN = await ethers.getContractFactory("BURN");
    BURN = await BURN.deploy();
    AUTO= await ethers.getContractFactory("LP");
    AUTO= await AUTO.deploy();
    UNI = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E",UNIabi.abi,ethers.provier);
    Factory = await ethers.getContractFactory('FreshSwapFactory');
    Factory = await Factory.deploy(USD.address,USD2.address);
    stake = await ethers.getContractFactory("FreshStake");
    stake = await stake.deploy("200","600",USD2.address,USD.address);
    console.log(Factory.address)
    TokenCreator = await ethers.getContractFactory('FreshSwapTokenFactory');
    TokenCreator= await TokenCreator.deploy(Factory.address);
    deployer_=USD.connect(deployer);
    await USD2.connect(deployer).transfer(stake.address,"600");
    await deployer_.transfer(testAC1.address,num);
    for(var i =0; i < accounts.length; i++){
      await deployer_.transfer(accounts[i].address,num);
    }
    for(var i =0; i < accounts.length; i++){
      await USD2.connect(deployer).transfer(accounts[i].address,num);
    }
    // for( let i =1; i <accounts.length; i++){ 
    //   await  UNI.connect(accounts[i]).swapExactETHForTokensSupportingFeeOnTransferTokens(
    //     0,
    //     ["0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c","0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"],
    //     accounts[i].address,
    //     1701776760000,
    //     {
    //       value:ethers.utils.parseEther("100")
    //     }
    //    )
    //  }
    //  await  UNI.connect(deployer).swapExactETHForTokensSupportingFeeOnTransferTokens(
    //   0,
    //   ["0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c","0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"],
    //   deployer.address,
    //   1701776760000,
    //   {
    //     value:ethers.utils.parseEther("100")
    //   }
    //  )
         
  })
  it("should import existing token",async()=>{
    var n = await USD.totalSupply();
    n  = Number(n)/1000;
    n=n.toLocaleString("fullwide",{useGrouping:false});
    console.log(n,await USD.totalSupply())
    await TokenCreator.connect(testAC1).createPool(USD.address,[],[],0,0,n,testAC1.address)
  })
  it("should allow staking into the staking pool", async()=>{
    await USD.connect(testAC1).approve(stake.address,"20");
    await stake.connect(testAC1).stake("20");
    console.log(await stake.showBlock(),await stake.endBlock());
    await USD.connect(testAC2).approve(stake.address,"30");
    await expect(await stake.showReward(testAC1.address)).to.be.equal("200");
    await stake.connect(testAC2).stake("30");
    await expect(await stake.showReward(testAC1.address)).to.be.equal("400");
    await USD.connect(testAC2).approve(stake.address,"20");
    await USD.connect(testAC2).approve(stake.address,"20");//another block to test if the amounts remain the same
    await expect(await stake.showReward(testAC1.address)).to.be.equal("480");
    await expect(await stake.showReward(testAC2.address)).to.be.equal("120");
    console.log(await stake.showBlock());
    await expect( stake.connect(testAC2).stake("20")).to.be.revertedWith("Staking has ended");
  })
  it("should allow removing tokens either before or after collecting the rewards",async()=>{
    await stake.connect(testAC1).claimReward();
    console.log(await stake.showReward(testAC1.address))
    await expect(await stake.showReward(testAC1.address)).to.equal("0");
    console.log(await USD.balanceOf(testAC1.address))
    await stake.connect(testAC1).unstake();
    console.log(await USD.balanceOf(testAC1.address));
    console.log(await USD2.balanceOf(stake.address));
    console.log(await stake.showReward(testAC2.address))
    console.log(await USD2.balanceOf(testAC2.address));
    await expect(await stake.showReward(testAC3.address)).to.equal("0")
    await stake.connect(testAC2).unstake();
    console.log(await USD2.balanceOf(testAC2.address));
    await expect(stake.connect(testAC3).unstake()).to.be.revertedWith("You have nothing staked");
    
  })
  
  it("Should not allow non admins to perform admin functions of setting USD, setting fees and chaning admin",async ()=>{
    await expect(Factory.connect(testAC1).setUSD(Factory.address)).to.be.revertedWith("You are not the admin");
    await expect(Factory.connect(testAC1).setFees(100,454,339,90)).to.be.revertedWith("You are not the admin");
    await expect(Factory.connect(testAC1).changeAdmin(Factory.address)).to.be.revertedWith("You are not the admin");
    await expect(Factory.connect(testAC1).setBountyThresh(200)).to.be.revertedWith("You are not the admin");
    await expect(Factory.connect(testAC1).setFreshAddress(testAC1.address)).to.be.revertedWith("You are not the admin");
    await expect(Factory.connect(testAC1).setNATIVE(Factory.address)).to.be.revertedWith("You are not the admin");
  })

  // it("should create a new contract with factory with just Burn tax",async()=>{
  //   await USD.connect(testAC1).approve(TokenCreator.address,ethers.utils.parseUnits("1000",18));
  //   console.log(await TokenCreator.USD());
  //   await (TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","310711998",[],[],"0","50",ethers.utils.parseUnits("100",18),testAC1.address));
  //   Tokenaddress =await TokenCreator.lastTkCreated(testAC1.address);
  //   var poolAddress = await Factory.TokenToPool(Tokenaddress);
  //   Pool = new ethers.Contract(poolAddress,poolABI.abi,ethers.provider);
  //   TestToken= new ethers.Contract(Tokenaddress,ibep20ABI.abi,ethers.provider);
  //   await TestToken.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("100000"));
  //   await USD.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("100000"));
  //   await Pool.connect(testAC1).addLiquidity(ethers.utils.parseEther("10000"),ethers.utils.parseEther("10000"));

  //   //LP for burn token on PCS
  //   await BURN.connect(deployer).approve(UNI.address,ethers.utils.parseEther("10000"));
  //   await USD.connect(deployer).approve(UNI.address,ethers.utils.parseEther("10000"));
  //   await UNI.connect(deployer).addLiquidity(
  //     BURN.address,
  //     USD.address,
  //     ethers.utils.parseEther("10000"),
  //     ethers.utils.parseEther("10000"),
  //     ethers.utils.parseEther("0"),
  //     ethers.utils.parseEther("0"),
  //     deployer.address,
  //     "1701776760000"
  //   )

  //     console.log(await Pool.USDPerToken()/1e18);
  //     console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]));
  // })

  // it("should change prices and update (burn tokens)", async()=>{
  //   await USD.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("1000"));
  //   var x =await Pool.connect(testAC2).buyToken_Qdy(ethers.utils.parseEther("1000"));
  //   x=await x.wait();
  //   console.log(x.gasUsed);

  //   await USD.connect(testAC2).approve(UNI.address,ethers.utils.parseEther("1000"));
  //   var x=await UNI.connect(testAC2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
  //     ethers.utils.parseEther("1000"),
  //     0,
  //     [USD.address,BURN.address],
  //     testAC2.address,
  //     "1701776760000"
    
  //   )
  //   x=await x.wait()
  //   console.log(x.gasUsed);
  //   console.log("Fresh rec tok: ",await TestToken.balanceOf(testAC2.address))
  //   console.log("Uni rec tok: ",await BURN.balanceOf(testAC2.address))

  //   console.log(await Pool.USDPerToken()/1e18);
  //   console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]));

  //   console.log(await Pool.tokenPerUSD()/1e18);
  //   console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",BURN.address,]));


  // })

  // it("should change prices and update (burn tokens) Sell", async()=>{
  //   await TestToken.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("1000"));
  //   var x= await USD.balanceOf(testAC2.address);
  //   console.log(x);
  //   await Pool.connect(testAC2).sellToken_qLx(TestToken.balanceOf(testAC2.address));
  //   console.log(await USD.balanceOf(testAC2.address))
  //   await BURN.connect(testAC2).approve(UNI.address,ethers.utils.parseEther("1000"));
  //   await UNI.connect(testAC2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
  //     BURN.balanceOf(testAC2.address),
  //     0,
  //     [BURN.address,USD.address],
  //     testAC2.address,
  //     "1701776760000"
    
  //   )
    
  //   console.log(await USD.balanceOf(testAC2.address))
    
  //   console.log(await Pool.USDPerToken()/1e18);
  //   console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]));
  //   console.log(await Pool.tokenPerUSD()/1e18);
  //   console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",BURN.address,]));
  // })

  // it("should create a new contract with factory with just normal tax",async()=>{
  //   await USD.connect(testAC1).approve(TokenCreator.address,ethers.utils.parseUnits("1000",18));
  //   console.log(await TokenCreator.USD());
  //   await (TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","310711998",[],[],"0","5",ethers.utils.parseUnits("100",18),testAC1.address));
  //   Tokenaddress =await TokenCreator.lastTkCreated(testAC1.address);
  //   var poolAddress = await Factory.TokenToPool(Tokenaddress);
  //   Pool = new ethers.Contract(poolAddress,poolABI.abi,ethers.provider);
  //   TestToken= new ethers.Contract(Tokenaddress,ibep20ABI.abi,ethers.provider);
  //   await TestToken.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("100000"));
  //   await USD.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("100000"));
  //   await Pool.connect(testAC1).addLiquidity(ethers.utils.parseEther("10000"),ethers.utils.parseEther("10000"));

  //   //LP for burn token on PCS
  //   await BURN.connect(deployer).approve(UNI.address,ethers.utils.parseEther("10000"));
  //   await USD.connect(deployer).approve(UNI.address,ethers.utils.parseEther("10000"));
  //   await UNI.connect(deployer).addLiquidity(
  //     BURN.address,
  //     USD.address,
  //     ethers.utils.parseEther("10000"),
  //     ethers.utils.parseEther("10000"),
  //     ethers.utils.parseEther("0"),
  //     ethers.utils.parseEther("0"),
  //     deployer.address,
  //     "1701776760000"
  //   )

  //     console.log(await Pool.USDPerToken()/1e18);
  //     console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]));
  //     console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1000000"),["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",BURN.address]));

  // })

  // it("should change prices and update (Normal tax tokens)", async()=>{
  //   await USD.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("1000"));
  //   await Pool.connect(testAC2).buyToken_Qdy(ethers.utils.parseEther("1000"));
  //   await USD.connect(testAC2).approve(UNI.address,ethers.utils.parseEther("1000"));
  //   console.log(await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]));
  //   await UNI.connect(testAC2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
  //     ethers.utils.parseEther("1000"),
  //     0,
  //     [USD.address,BURN.address],
  //     testAC2.address,
  //     "1701776760000"
    
  //   )
  //   console.log("Fresh rec tok: ",await TestToken.balanceOf(testAC2.address))
  //   console.log("Uni rec tok: ",await BURN.balanceOf(testAC2.address))
  //   //await BURN.connect(deployer).swapTokens();
  //   console.log(await Pool.USDPerToken()/1e18);
  //   var x=await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]);
  //   console.log(x[1]/1e18);
  //   console.log(await Pool.tokenPerUSD()/1e18);
  //   x=await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",BURN.address]);
  //   console.log(x[1]/1e18);

  // })

  // it("should change prices and update (normal tokens) Sell", async()=>{
  //   await TestToken.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("1000"));
  //   var x= await USD.balanceOf(testAC2.address);
  //   console.log(x);
  //   await Pool.connect(testAC2).sellToken_qLx(TestToken.balanceOf(testAC2.address));
  //   console.log(await USD.balanceOf(testAC2.address))
  //   await BURN.connect(testAC2).approve(UNI.address,ethers.utils.parseEther("1000"));
  //   await UNI.connect(testAC2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
  //     BURN.balanceOf(testAC2.address),
  //     0,
  //     [BURN.address,USD.address],
  //     testAC2.address,
  //     "1701776760000"
    
  //   )
  //   //await BURN.connect(deployer).swapTokens();

    

  //   console.log(await USD.balanceOf(testAC2.address))
    
  //   console.log(await Pool.USDPerToken()/1e18);
  //   var x=await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),[BURN.address,"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]);
  //   console.log(x[1]/1e18);
  //   console.log(await Pool.tokenPerUSD()/1e18);
  //   x=await UNI.connect(deployer).getAmountsOut(ethers.utils.parseEther("1"),["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",BURN.address]);
  //   console.log(x[1]/1e18);
  // })

  /*--------------------------------------------------------------*/
  it("Should allow creating of new tokens from the Token Creator Factory", async ()=>{
    await USD.connect(testAC1).approve(TokenCreator.address,ethers.utils.parseUnits("10000000000",18));
    await expect((TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","1","310711998",[20,20],[testAC2.address,testAC1.address],"10",ethers.utils.parseUnits("10",18),testAC1.address))).to.be.revertedWith("DAO Threshold cannot be that low");
    console.log("A");
    await (TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","1","310711998",[20,20],[testAC2.address,testAC1.address],"10",ethers.utils.parseUnits("310712",18),testAC1.address));
    Tokenaddress =await TokenCreator.lastTkCreated(testAC1.address);
    var poolAddress = await Factory.TokenToPool(Tokenaddress);
    Pool = new ethers.Contract(poolAddress,poolABI.abi,ethers.provider);
    expect(await Pool.BaseAddress()===USD.address).to.equal(true);
    expect(Number(await Pool.viewBuyTax())).to.equal(50);
    expect(Number(await Pool.viewSellTax())).to.equal(50);
    expect(await USD.balanceOf(Factory.address)==ethers.utils.parseEther("70"))==true;
  })

  it("should only allow owner to add liquidity to the pool but through notifier", async()=>{
    await USD.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("20000000000"));
    TestToken = new ethers.Contract(Tokenaddress,ibep20ABI.abi,ethers.provider);
    await TestToken.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("200000000000000000"));
    var decimals = await TestToken.decimals();
    console.log(decimals)
    var not= new ethers.Contract(await Pool.not(),taxHandlerABI.abi);
    await expect (not.connect(testAC2).addLiquidity()).to.be.revertedWith("not owner")
    await USD.connect(testAC1).transfer(not.address,ethers.utils.parseEther("20000"));
    await TestToken.connect(testAC1).transfer(not.address,ethers.utils.parseEther("200000000"));
    await not.connect(testAC1).addLiquidity();
    await expect( Pool.connect(testAC2).addLiquidity(ethers.utils.parseEther("20000"),ethers.utils.parseUnits("2000",decimals))).to.be.revertedWith("You are not project owner or token");
    await Pool.connect(testAC1).addLiquidity(ethers.utils.parseEther("200000000"),ethers.utils.parseUnits("2000",decimals));
    await expect(await Pool.priceSet()).to.equal(true);
    console.log(await Pool.DAOThreshold()/1e18);
  })
    
  it("should allow only FreshSwap owner to transfer money to their wallet",async()=>{
    await expect(Factory.connect(testAC1).withdrawALLUSD()).to.be.revertedWith("You are not the admin");
    await Factory.connect(deployer).withdrawALLUSD();
    expect(await USD.balanceOf(Factory.address)).to.equal("0");
  })

  it("Should allow buying and selling of tokens once LP is added and not mint a DAO token if the invested amount is below the DAO threshold",async ()=>{
    await USD.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("50"));
    var x =await Pool.connect(testAC2).buyToken_Qdy(ethers.utils.parseEther("50"),testAC2.address);
    x= await x.wait();
    console.log("gas used:",x.gasUsed*x.effectiveGasPrice, x.gasUsed);
    await expect(USD.balanceOf(Pool.address)>ethers.utils.parseEther("20000")).to.equal(true);
    console.log(await TestToken.balanceOf(Pool.address)/1e18 )
    await expect( await TestToken.balanceOf(Pool.address)<ethers.utils.parseEther("22000")).to.equal(true);
    await expect(await Pool.totalSupply()).to.equal("1");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
  })

  it("Should not allow purchasing more than 85% of the tokens in the Pool", async ()=>{
    await expect(Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("20000"),testAC3.address)).to.be.revertedWith("LOW LP");
  })

  it("Should mint a DAO token for purchasing more than the threshold", async()=>{
    await USD.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("300"));
    await Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("300"),testAC3.address);
    await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
    await expect(await Pool.totalSupply()).to.equal("2");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
  })

  it("should change the Sale tax only by owner(fail when going above 30%)and also update on the Pool once a transaction is made",async()=>{
    var ad=await Pool.not();
    var TaxHandle = new ethers.Contract(ad,taxHandlerABI.abi,ethers.provider);
    await expect( TaxHandle.connect(testAC1).updateSaleTax("500",[20,20])).to.be.reverted;
    await expect( TaxHandle.connect(testAC2).updateSaleTax("500",[20,20])).to.be.reverted;
    await expect(await TaxHandle.showtotalSaleTax()).to.equal("50");
    await expect(TaxHandle.connect(testAC1).updateSaleTax("5",[3,3,3])).to.be.revertedWith("Cannot add any extra tax");
    await TaxHandle.connect(testAC1).updateSaleTax("50",[30,30])
    await expect(await TaxHandle.showtotalSaleTax()).to.equal("110");
  });

  it("should not mint a new DAO token when a wallet already has a DAO token",async()=>{
    await USD.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("1000"));
    await Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("1000"),testAC3.address);
    await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
    await expect(await Pool.totalSupply()).to.equal("2");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
  })

  it("should not burn the DAO token if invested amount is still greater than the DAO threshold after selling", async()=>{
    await TestToken.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("100"));
    await Pool.connect(testAC3).sellToken_qLx(ethers.utils.parseEther("100"),testAC3.address);
    await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
    await expect(await Pool.totalSupply()).to.equal("2");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
  })

  it("should burn the DAO token if invested amount goes below the DAO threshold after selling", async()=>{
    await USD.connect(testAC4).approve(Pool.address,ethers.utils.parseEther("500"));
    await Pool.connect(testAC4).buyToken_Qdy(ethers.utils.parseEther("500"),testAC4.address);
    await expect(await Pool.totalSupply()).to.equal("3");
    await expect(await Pool.balanceOf(testAC4.address)).to.equal("1");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
    await TestToken.connect(testAC4).approve(Pool.address,ethers.utils.parseEther("400"));
    await Pool.connect(testAC4).sellToken_qLx(ethers.utils.parseEther("400"),testAC4.address);
    await expect(await Pool.balanceOf(testAC4.address)).to.equal("1");
    await expect(await Pool.totalSupply()).to.equal("3");
    await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
    await expect(await Pool.viewSellTax()).to.equal("110");
  })

  it("should not allow anyone else butonly the owner of the project to request a DAO vote", async()=>{
    await expect(Pool.connect(testAC3).requestLPRemovalDAO()).to.be.revertedWith('You are not the project owner');
    await Pool.connect(testAC1).requestLPRemovalDAO();
    await expect(Pool.connect(testAC1).vote("1")).to.be.reverted;
  })

  it("should not allow any trade to go through while the voting is being conducted and also not allow the owner to remove LP but trading resumes when majority votes No",async()=>{
    await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
    await expect(Pool.connect(testAC2).removeLP()).to.be.reverted;
    await USD.connect(testAC6).approve(Pool.address,"1000");
    await expect(Pool.connect(testAC6).buyToken_Qdy("2",testAC6.address)).to.be.revertedWith("TRADE DISABLED");
    await Pool.connect(testAC3).vote("1");
    await Pool.connect(testAC2).vote("1");
    await USD.connect(testAC6).approve(Pool.address,"10000");
    await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
    await Pool.connect(testAC6).buyToken_Qdy("10000",testAC6.address);
    await expect(await TestToken.balanceOf(testAC6.address)!=0).to.equal(true)
  })

  it("should allow removing of LP when the majority has voted yes for LP removal", async()=>{
    await Pool.connect(testAC1).requestLPRemovalDAO();
    await Pool.connect(testAC3).vote("0");
    await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
    await Pool.connect(testAC2).vote("0");
    console.log(await Pool.totalSupply());
    await expect(Pool.connect(testAC2).removeLP()).to.be.revertedWith("You are not the project owner");
    await Pool.connect(testAC1).removeLP();
    await expect(await USD.balanceOf(Pool.address)).to.be.equal("0")
  })

//   it("should allow Freshswap to approve emergency withdraw when 3 days have passed and no DAO decision made",async()=>{
//     await Pool.connect(testAC1).requestLPRemovalDAO();
//     console.log(await Pool.balanceOf(testAC1.address));
//     await expect(Pool.connect(testAC1).vote("0")).to.be.reverted;
//     await expect(Pool.connect(deployer).approveEmergencyWithdraw()).to.be.reverted;
//     await ethers.provider.send("evm_mine", [1687681999]);
//     await expect(Pool.connect(testAC1).approveEmergencyWithdraw()).to.be.reverted;
//     await expect(Factory.connect(testAC1).approveEmergencyWithdraw(Pool.address)).to.be.reverted;
//     await Factory.connect(deployer).approveEmergencyWithdraw(Pool.address);
//     await expect(await USD2.balanceOf(Pool.address)).to.be.equal("0");
//     console.log(await USD2.balanceOf(Pool.address)/1e18);
// })

it("Should allow creating of new tokens from the Token Creator Factory", async ()=>{
  await USD.connect(testAC1).approve(TokenCreator.address,ethers.utils.parseUnits("10000000000",18));
  await expect((TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","0","310711998",[20,20],[testAC2.address,testAC1.address],"10",ethers.utils.parseUnits("10",18),testAC1.address))).to.be.revertedWith("DAO Threshold cannot be that low");
  console.log("A");
  await (TokenCreator.connect(testAC1).createSimpleToken("JD Token","JD","0","310711998",[20,20],[testAC2.address,testAC1.address],"10",ethers.utils.parseUnits("310712",18),testAC1.address));
  Tokenaddress =await TokenCreator.lastTkCreated(testAC1.address);
  var poolAddress = await Factory.TokenToPool(Tokenaddress);
  Pool = new ethers.Contract(poolAddress,poolABI.abi,ethers.provider);
  expect(await Pool.BaseAddress()===USD2.address).to.equal(true);
  expect(Number(await Pool.viewBuyTax())).to.equal(50);
  expect(Number(await Pool.viewSellTax())).to.equal(50);
  expect(await USD.balanceOf(Factory.address)==ethers.utils.parseEther("70"))==true;
})

it("should only allow owner to add liquidity to the pool", async()=>{
  await USD2.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("20000000000"));
  TestToken = new ethers.Contract(Tokenaddress,ibep20ABI.abi,ethers.provider);
  await TestToken.connect(testAC1).approve(Pool.address,ethers.utils.parseEther("200000000000000000"));
  var decimals = await TestToken.decimals();
  console.log(decimals)
  await expect( Pool.connect(testAC2).addLiquidity(ethers.utils.parseEther("20000"),ethers.utils.parseUnits("2000",decimals))).to.be.revertedWith("You are not project owner or token");
  await Pool.connect(testAC1).addLiquidity(ethers.utils.parseEther("200000000"),ethers.utils.parseUnits("20000",decimals));
  await expect(await Pool.priceSet()).to.equal(true);
  console.log(await Pool.DAOThreshold()/1e18);
})
  
it("should allow only FreshSwap owner to transfer money to their wallet",async()=>{
  await expect(Factory.connect(testAC1).withdrawALLUSD()).to.be.revertedWith("You are not the admin");
  await Factory.connect(deployer).withdrawALLUSD();
  expect(await USD2.balanceOf(Factory.address)).to.equal("0");
})

it("Should allow buying and selling of tokens once LP is added and not mint a DAO token if the invested amount is below the DAO threshold",async ()=>{
  await USD2.connect(testAC2).approve(Pool.address,ethers.utils.parseEther("50"));
  var x =await Pool.connect(testAC2).buyToken_Qdy(ethers.utils.parseEther("50"),testAC2.address);
  x= await x.wait();
  console.log("gas used:",x.gasUsed*x.effectiveGasPrice, x.gasUsed);
  await expect(USD2.balanceOf(Pool.address)>ethers.utils.parseEther("20000")).to.equal(true);
  await expect( await TestToken.balanceOf(Pool.address)<ethers.utils.parseEther("20000")).to.equal(true);
  await expect(await Pool.totalSupply()).to.equal("1");
  await expect(await USD2.balanceOf(Tokenaddress)).to.equal("0");
})

it("Should not allow purchasing more than 85% of the tokens in the Pool", async ()=>{
  await expect(Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("18000"),testAC3.address)).to.be.revertedWith("LOW LP");
})

it("Should mint a DAO token for purchasing more than the threshold", async()=>{
  await USD2.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("300"));
  await Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("300"),testAC3.address);
  await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
  await expect(await Pool.totalSupply()).to.equal("2");
  await expect(await USD.balanceOf(Tokenaddress)).to.equal("0");
})

it("should change the Sale tax only by owner(fail when going above 30%)and also update on the Pool once a transaction is made",async()=>{
  var ad=await Pool.not();
  var TaxHandle = new ethers.Contract(ad,taxHandlerABI.abi,ethers.provider);
  await expect( TaxHandle.connect(testAC1).updateSaleTax("500",[20,20])).to.be.reverted;
  await expect( TaxHandle.connect(testAC2).updateSaleTax("500",[20,20])).to.be.reverted;
  await expect(await TaxHandle.showtotalSaleTax()).to.equal("50");
  await expect(TaxHandle.connect(testAC1).updateSaleTax("5",[3,3,3])).to.be.revertedWith("Cannot add any extra tax");
  await TaxHandle.connect(testAC1).updateSaleTax("50",[30,30])
  await expect(await TaxHandle.showtotalSaleTax()).to.equal("110");
});

it("should not mint a new DAO token when a wallet already has a DAO token",async()=>{
  await USD2.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("1000"));
  await Pool.connect(testAC3).buyToken_Qdy(ethers.utils.parseEther("1000"),testAC3.address);
  await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
  await expect(await Pool.totalSupply()).to.equal("2");
  await expect(await USD2.balanceOf(Tokenaddress)).to.equal("0");
})

it("should not burn the DAO token if invested amount is still greater than the DAO threshold after selling", async()=>{
  await TestToken.connect(testAC3).approve(Pool.address,ethers.utils.parseEther("100"));
  await Pool.connect(testAC3).sellToken_qLx(ethers.utils.parseEther("100"),testAC3.address);
  await expect(await Pool.balanceOf(testAC3.address)).to.equal("1");
  await expect(await Pool.totalSupply()).to.equal("2");
  await expect(await USD2.balanceOf(Tokenaddress)).to.equal("0");
})

it("should burn the DAO token if invested amount goes below the DAO threshold after selling", async()=>{
  await USD2.connect(testAC4).approve(Pool.address,ethers.utils.parseEther("500"));
  await Pool.connect(testAC4).buyToken_Qdy(ethers.utils.parseEther("500"),testAC4.address);
  await expect(await Pool.totalSupply()).to.equal("3");
  await expect(await Pool.balanceOf(testAC4.address)).to.equal("1");
  await expect(await USD2.balanceOf(Tokenaddress)).to.equal("0");
  await TestToken.connect(testAC4).approve(Pool.address,ethers.utils.parseEther("400"));
  await Pool.connect(testAC4).sellToken_qLx(ethers.utils.parseEther("400"),testAC4.address);
  await expect(await Pool.balanceOf(testAC4.address)).to.equal("1");
  await expect(await Pool.totalSupply()).to.equal("3");
  await expect(await USD2.balanceOf(Tokenaddress)).to.equal("0");
  await expect(await Pool.viewSellTax()).to.equal("110");
})

it("should not allow anyone else butonly the owner of the project to request a DAO vote", async()=>{
  await expect(Pool.connect(testAC3).requestLPRemovalDAO()).to.be.revertedWith('You are not the project owner');
  await Pool.connect(testAC1).requestLPRemovalDAO();
  await expect(Pool.connect(testAC1).vote("1")).to.be.reverted;
})

it("should not allow any trade to go through while the voting is being conducted and also not allow the owner to remove LP but trading resumes when majority votes No",async()=>{
  await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
  await expect(Pool.connect(testAC2).removeLP()).to.be.reverted;
  await USD2.connect(testAC6).approve(Pool.address,"1000");
  await expect(Pool.connect(testAC6).buyToken_Qdy("2",testAC6.address)).to.be.revertedWith("TRADE DISABLED");
  await Pool.connect(testAC3).vote("1");
  await Pool.connect(testAC2).vote("1");
  await USD2.connect(testAC6).approve(Pool.address,"10000");
  await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
  await Pool.connect(testAC6).buyToken_Qdy("10000",testAC6.address);
  await expect(await TestToken.balanceOf(testAC6.address)!="0").to.equal(true)
})

it("should allow Freshswap to disapprove emergency withdraw when 3 days have passed and no DAO decision made",async()=>{
  await Pool.connect(testAC1).requestLPRemovalDAO();
  console.log(await Pool.balanceOf(testAC1.address));
  await expect(Pool.connect(testAC1).vote("0")).to.be.reverted;
  await expect(Pool.connect(deployer).approveEmergencyWithdraw()).to.be.reverted;
  await ethers.provider.send("evm_mine", [1695630799]);
  await expect(Pool.connect(testAC1).approveEmergencyWithdraw()).to.be.reverted;
  await expect(Factory.connect(testAC1).approveEmergencyWithdraw(Pool.address,0)).to.be.reverted;
  await Factory.connect(deployer).approveEmergencyWithdraw(Pool.address,1);
  //await expect(await USD2.balanceOf(Pool.address)).to.be.equal("0");
  console.log(await USD2.balanceOf(Pool.address)/1e18);
  await USD2.connect(testAC6).approve(Pool.address,"1000");
  await Pool.connect(testAC6).buyToken_Qdy("2",testAC6.address);
  await expect(await Pool.tradingEnabled()).to.equal(true);
  console.log(await Pool.tradingEnabled());
  await expect(TestToken.balanceOf(testAC6.address)!="0").to.equal(true);
})

// it("should allow removing of LP when the majority has voted yes for LP removal", async()=>{
//   await Pool.connect(testAC1).requestLPRemovalDAO();
//   await Pool.connect(testAC3).vote("0");
//   await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
//   await Pool.connect(testAC2).vote("0");
//   console.log(await Pool.totalSupply());
//   await expect(Pool.connect(testAC2).removeLP()).to.be.revertedWith("You are not the project owner");
//   await Pool.connect(testAC1).removeLP();
//   await expect(await USD2.balanceOf(Pool.address)).to.be.equal("0")
// })
it("should not allow anyone else butonly the owner of the project to request a DAO vote", async()=>{
  await expect(Pool.connect(testAC3).requestLPRemovalDAO()).to.be.revertedWith('You are not the project owner');
  await Pool.connect(testAC1).requestLPRemovalDAO();
  await expect(Pool.connect(testAC1).vote("1")).to.be.reverted;
})

it("should not allow any trade to go through while the voting is being conducted and also not allow the owner to remove LP but trading resumes when majority votes No",async()=>{
  await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
  await expect(Pool.connect(testAC2).removeLP()).to.be.reverted;
  await USD2.connect(testAC6).approve(Pool.address,"1000");
  await expect(Pool.connect(testAC6).buyToken_Qdy("2",testAC6.address)).to.be.revertedWith("TRADE DISABLED");
  await Pool.connect(testAC3).vote("1");
  await Pool.connect(testAC2).vote("1");
  await USD2.connect(testAC6).approve(Pool.address,"10000");
  await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
  await Pool.connect(testAC6).buyToken_Qdy("10000",testAC6.address);
  await expect(await TestToken.balanceOf(testAC6.address)!=0).to.equal(true)
})

// it("should allow Freshswap to approve emergency withdraw when 3 days have passed and no DAO decision made",async()=>{
//   await Pool.connect(testAC1).requestLPRemovalDAO();
//   console.log(await Pool.balanceOf(testAC1.address));
//   await expect(Pool.connect(testAC1).vote("0")).to.be.reverted;
//   await expect(Pool.connect(deployer).approveEmergencyWithdraw()).to.be.reverted;
//   await ethers.provider.send("evm_mine", [1795630799]);
//   await expect(Pool.connect(testAC1).approveEmergencyWithdraw()).to.be.reverted;
//   await expect(Factory.connect(testAC1).approveEmergencyWithdraw(Pool.address,0)).to.be.reverted;
//   await Factory.connect(deployer).approveEmergencyWithdraw(Pool.address,0);
//   await expect(await USD2.balanceOf(Pool.address)).to.be.equal("0");
//   console.log(await USD2.balanceOf(Pool.address)/1e18);
// })
  it("should allow removing of LP when the majority has voted yes for LP removal", async()=>{
  await Pool.connect(testAC1).requestLPRemovalDAO();
  await Pool.connect(testAC3).vote("0");
  await expect(Pool.connect(testAC1).removeLP()).to.be.reverted;
  await Pool.connect(testAC2).vote("0");
  console.log(await Pool.totalSupply());
  await expect(Pool.connect(testAC2).removeLP()).to.be.revertedWith("You are not the project owner");
  await Pool.connect(testAC1).removeLP();
  await expect(await USD2.balanceOf(Pool.address)).to.be.equal("0")
})
    }

   
  
  
 );

 