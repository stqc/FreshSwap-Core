pragma solidity >=0.8.0;

//SPDX-License-Identifier: UNLICENSED

import "./helper.sol";

contract TaxHandler{

    using SafeMath for uint256;
    
    address public token;
    address public owner;
    address public USD;
    address public factory_;
    address [] public wallets;
    uint256 public LPtax_buy;
    uint256 public BurnTax_buy;
    uint256 public LPtax_sell;
    uint256 public BurnTax_Sell;
    uint256 public totalBuyTax;
    uint256 public totalSaleTax;
    uint256 [] public additional_buyTax;
    uint256 [] public additional_saleTax;
    factoryMethod Ruler;
    
    constructor(address tk,address own, address factory ,address [] memory wals,
    uint256 [] memory additionals,uint256 LPtax,uint256 burn_
    ){
        token=tk;
        owner=own;
        wallets=wals;
        factory_=factory;
        Ruler= factoryMethod(factory_);
        USD=Ruler.showUSD();
        additional_buyTax=additionals;
        additional_saleTax=additionals;
        LPtax_buy=LPtax;
        LPtax_sell=LPtax;
        BurnTax_buy=burn_;
        BurnTax_Sell=burn_;
        
        for(uint256 i=0; i<wals.length; i++){
            totalBuyTax+=additionals[i];
        }

        totalSaleTax=totalBuyTax;
    }

    bool isLocked=false;

    function showtotalBuyTax() external view returns(uint256){return totalBuyTax;}
    function showtotalSaleTax() external view returns(uint256){return totalSaleTax;}

    function autoLP(uint256 amount, uint256 action) internal{
        uint256 currentRate;
        if(LPtax_buy>0 || LPtax_sell>0){
           
           if(action==0){
                currentRate=(LPtax_buy.mul(100)).div(100);
           }else{
                currentRate=(LPtax_sell.mul(100)).div(100);
           }

            uint256 USDavailable=(amount.mul(currentRate)).div(100);

        }

    }

    function burn(uint256 amount, uint256 action) internal{
        if(BurnTax_buy>0 || BurnTax_Sell>0){
            uint256 currentRate=action==0?(BurnTax_buy.mul(100)).div(totalBuyTax):(BurnTax_Sell.mul(100)).div(totalSaleTax);
            amount = (amount.mul(currentRate)).div(100);
            IBEP20(USD).approve(Ruler.showPoolAddress(token), amount*1e18);
            poolMethods Pool = poolMethods(Ruler.showPoolAddress(token));
            Pool.buyToken(amount);
            IBEP20(token).burn(IBEP20(token).balanceOf(address(this)));
        }
    }

    function onTradeCompletion(uint256 tax, uint256 action) external{
        require(msg.sender==Ruler.showPoolAddress(token),"Not Authorized");
        if(!isLocked){
            isLocked=true;
            autoLP(tax, action);
            burn(tax,action);
            tax=IBEP20(USD).balanceOf(address(this));
            if(action==0){
                uint256 totalBuyTax_=totalBuyTax.sub(BurnTax_buy).sub(LPtax_buy);
                for(uint256 i=0;i<wallets.length; i++){
                    uint256 toTransfer=tax.mul((additional_buyTax[i].mul(100)).div(totalBuyTax_));
                    IBEP20(USD).transfer(wallets[i], toTransfer);
                }
            }else{
                uint256 totalSaleTax_=totalSaleTax.sub(BurnTax_Sell).sub(LPtax_sell);
                    for(uint256 i=0;i<wallets.length; i++){
                        uint256 toTransfer=tax.mul((additional_buyTax[i].mul(100)).div(totalSaleTax_));
                        IBEP20(USD).transfer(wallets[i], toTransfer);
                }
            }
            
        }
        isLocked=false;

    }

function updateBuyTax(uint256 lp, uint256 burnRate, uint256[] memory vals) external {
        require(msg.sender==owner);
        require(vals.length==wallets.length,"Cannot add any extra tax");
        totalBuyTax=0;
        additional_buyTax=vals;
        LPtax_buy=lp;
        BurnTax_buy=burnRate;
        for(uint256 i=0;i<vals.length;i++){
        totalBuyTax=totalBuyTax.add(vals[i]);
        }
        totalBuyTax=totalBuyTax.add(lp).add(burnRate);
        require(totalBuyTax<30);
  }

  function updateSaleTax(uint256 lp, uint256 burnRate, uint256[] memory vals) external{
    require(msg.sender==owner);
    require(vals.length==wallets.length,"Cannot add any extra tax");
    totalSaleTax=0;
    additional_saleTax=vals;
    LPtax_sell=lp;
    BurnTax_Sell=burnRate;
    for(uint256 i=0;i<vals.length;i++){
      totalSaleTax=totalSaleTax.add(vals[i]);
    }
    totalSaleTax=totalSaleTax.add(lp).add(burnRate);
    require(totalSaleTax<30);
  }


}