pragma solidity >=0.8.0;

//SPDX-License-Identifier: UNLICENSED

import "./testToken.sol";
import "./FreshSwapFactoryInterface.sol";
import "./poolMethods.sol";

contract TaxHandler{

    address public token;
    // address public owner;
    address public USD;
    address public factory_;
    uint256 isLocked;
    uint256 public LPtax_buy;
    uint256 public LPtax_sell;
    uint256 public totalBuyTax;
    uint256 public totalSaleTax;
    uint256 immutable maxIds;
    mapping(uint256=>uint256) public additional_buyTax;
    mapping (uint256=>uint256) public additional_saleTax;
    factoryMethod immutable Ruler;
    IBEP20 immutable USDCToken;
    FSBEP20 immutable TradedToken;
    address [] public wallets;

    constructor(address tk, address factory,address base ,address [] memory wals,
    uint256 [] memory additionals,uint256 LPtax){
        token=tk;
        // owner=own;
        wallets=wals;
        factory_=factory;
        Ruler= factoryMethod(factory_);
        USD=base;
        LPtax_buy=LPtax;
        LPtax_sell=LPtax;
        maxIds=wals.length;
        for(uint256 i; i<maxIds;){
            totalBuyTax+=additionals[i];
            additional_buyTax[i]=additionals[i];
            additional_saleTax[i]=additionals[i];
            unchecked {
                ++i;
            }
        }
        totalBuyTax=totalBuyTax+LPtax;
        totalSaleTax=totalBuyTax;
        USDCToken = IBEP20(USD);
        TradedToken = FSBEP20(token);
    }

    function showtotalBuyTax() external view returns(uint256){return totalBuyTax;}
    function showtotalSaleTax() external view returns(uint256){return totalSaleTax;}
    function showNumOfWallets() external view returns(uint256){return wallets.length;}
    function autoLP(uint256 amount) internal{
        uint256 currentRate;
        if( LPtax_sell>0){
       
            currentRate=(LPtax_sell*100)/totalSaleTax;

            uint256 USDavailable=(amount*currentRate)/100;
            
            uint256 USDtoSell=USDavailable/2;
            uint256 remainingUSD = USDavailable-USDtoSell;            
            poolMethods Pool = poolMethods(Ruler.showPoolAddress(token));
            uint256 currentTokenBalance = FSBEP20(token).balanceOf(address(this));
            USDCToken.approve(address(Pool), USDtoSell);
            Pool.buyToken_Qdy(USDtoSell,address(this));
            uint256 newTokenBalance = FSBEP20(token).balanceOf(address(this))-currentTokenBalance;
            TradedToken.approve(address(Pool), newTokenBalance);
            USDCToken.approve(address(Pool), remainingUSD);
            uint256 USDRequired = (Pool.USDPerToken()*newTokenBalance)/1e18;
            Pool.addLiquidity(newTokenBalance, USDRequired);
        }
    }

    function onTradeCompletion() external{
        uint256 tax=USDCToken.balanceOf(address(this));
        if(msg.sender!=poolMethods(Ruler.showPoolAddress(token)).beneficieryAddress()){
            
            require(FSBEP20(Ruler.viewFreshAddress()).balanceOf(msg.sender)>=Ruler.viewBountyThresh(),"insufficient FRESH tokens for this bounty");
            (,,,uint256 Fee)=Ruler.showFees();
            uint256 toShare=(tax*Fee)/100;
            tax-=toShare;
            USDCToken.transfer(msg.sender, toShare);
        }
        if(isLocked==0){
            isLocked=1;
            autoLP(tax);
            uint256 len=maxIds;
            uint256 rt;
                tax=USDCToken.balanceOf(address(this));
                uint256 totalSaleTax_;
                totalSaleTax_=totalSaleTax-LPtax_sell;
                for(uint256 i=0;i<len;){
                        rt=(additional_saleTax[i]*100)/totalSaleTax_;
                        uint256 toTransfer=(tax*rt)/100;
                        USDCToken.transfer(wallets[i], toTransfer);
                        
                            ++i;
                        
                }
                
            
        
        isLocked=0;
    }
    }

function addLiquidity() external{
    require(msg.sender==poolMethods(Ruler.showPoolAddress(token)).beneficieryAddress(),"not owner");
    poolMethods pool = poolMethods(Ruler.showPoolAddress(token));
    USDCToken.approve(address(pool), USDCToken.balanceOf(address(this)));
    TradedToken.approve(address(pool), TradedToken.balanceOf(address(this)));
    pool.addLiquidity(TradedToken.balanceOf(address(this)), USDCToken.balanceOf(address(this)));
}

function updateBuyTax(uint256 lp, uint256[] memory vals) external {
        require(msg.sender==poolMethods(Ruler.showPoolAddress(token)).beneficieryAddress());
        require(vals.length==wallets.length,"Cannot add any extra tax");
        totalBuyTax=0;
        LPtax_buy=lp;
        for(uint256 i=0;i<vals.length;i++){
        totalBuyTax=totalBuyTax+vals[i];
        additional_buyTax[i]=vals[i];
        }
        totalBuyTax=totalBuyTax+lp;
        require(totalBuyTax<300);
  }

  function updateSaleTax(uint256 lp, uint256[] memory vals) external{
    require(msg.sender==poolMethods(Ruler.showPoolAddress(token)).beneficieryAddress());
    require(vals.length==wallets.length,"Cannot add any extra tax");
    totalSaleTax=0;
    LPtax_sell=lp;
    for(uint256 i=0;i<vals.length;i++){
      totalSaleTax=totalSaleTax+(vals[i]);
      additional_saleTax[i]=vals[i];
    }
    totalSaleTax=totalSaleTax+lp;
    require(totalSaleTax<300);
  }


}

contract FreshSwapTokenFactory{

    address public owner;
    address public fundHolder;
    uint256 public fee=70*1e18;
    address public USD;
    IBEP20 con;
    mapping(address=> address[]) public tokensCreatedByAddress;

    constructor(address _fundHolder){

        owner=msg.sender;
        fundHolder = _fundHolder;
        USD = factoryMethod(_fundHolder).showUSD();
        con = IBEP20(USD);

    }

    function setTokenCreationFee(uint256 feeAMT) external{
        require(msg.sender==owner,"You are not the father");
        fee = feeAMT*10**18;
    }

    function changeOwner(address newOwner) external{
        require(msg.sender==owner,"You are not the father");
        owner = newOwner;
    }

    function changeFundHolder(address holder) external{
        require(msg.sender==owner,"You are not the father");
        fundHolder = holder;
    }
    function lastTkCreated(address u) external view returns(address){
        return tokensCreatedByAddress[u][tokensCreatedByAddress[u].length-1];
    }

    function createSimpleToken(string memory name, string memory symbol,uint256 base,
                            uint256 supply,uint256 [] memory TbuyTax,address [] memory wallets,uint256 LP, uint256 DAO,address ref) external{
                con.transferFrom(msg.sender,fundHolder,fee);                
                FSBEP20 newContract = new FSBEP20(name,symbol,supply,msg.sender);
                address mainBase = base==0?factoryMethod(fundHolder).showNative():factoryMethod(fundHolder).showUSD();
                TaxHandler txHandler = new TaxHandler(address(newContract),fundHolder,mainBase,wallets,TbuyTax,LP);
                factoryMethod(fundHolder).createNewPool(address(newContract), msg.sender, base,DAO, newContract.totalSupply(), ref, address(txHandler));
                tokensCreatedByAddress[msg.sender].push(address(newContract));
    }

    function createPool(address token,uint256 [] memory TBT, address [] memory rec,uint256 base,uint256 LP, uint256 DAO, address ref) external{
        address mainBase = base==0?factoryMethod(fundHolder).showNative():factoryMethod(fundHolder).showUSD();
        TaxHandler txHandler = new TaxHandler(token,fundHolder,mainBase,rec,TBT,LP);
        factoryMethod(fundHolder).createNewPool(token, msg.sender,base , DAO, IBEP20(token).totalSupply(), ref, address(txHandler));
    }


}