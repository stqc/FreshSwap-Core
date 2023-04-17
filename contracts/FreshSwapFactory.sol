pragma solidity >=0.8.0;
//SPDX-License-Identifier: UNLICENSED

 import "./pool.sol";
 import "./FreshSwapFactoryInterface.sol";


contract FreshSwapFactory is factoryMethod{

     address public admin;
     mapping(address=>address) public TokenToPool;
     mapping(address=>bool) public poolExists;
     address[] public allTokens;
     address public FreshToken;
     address public USDbase;
     address public nativeBase;
     uint256 public Platformfee=10;
     uint256 public PlatformfeeOnNoTax=5;
     uint256 public referalFee=10;
     uint256 public bountyFee=2;
     uint256 public bountyThresh=50*1e18;
    constructor(address baseUSD, address native){
        admin = msg.sender;
        Platformfee = 10;
        PlatformfeeOnNoTax=5;
        referalFee=10;
        USDbase=baseUSD;
        nativeBase=native;
    }

 
    function changeAdmin(address newAdmin) external {
        require(msg.sender==admin,"You are not the admin");
        admin = newAdmin;
    }

    function setUSD(address add)external{
        require(msg.sender==admin,"You are not the admin");
        USDbase = add;
    }
    
    function setNATIVE(address add) external{
        require(msg.sender==admin,"You are not the admin");
        nativeBase=add;
    }

    function showFees()external view returns(uint256,uint256,uint256,uint256){
        return (Platformfee,PlatformfeeOnNoTax,referalFee,bountyFee);
    }
    
    function showPoolAddress(address token) external view returns (address){
            return TokenToPool[token];
     }
    function showUSD() external view returns (address){
        return USDbase;
    }
    function showNative() external view returns(address){
        return nativeBase;
    }

    function getAllTokens() external view returns(address [] memory ) {
        address [] memory tokens = new address [](allTokens.length);
        for(uint i; i<allTokens.length;i++){
            tokens[i]=allTokens[i];
        }
        return tokens;
    }
    function viewBountyThresh() external view returns(uint256){
        return bountyThresh;
    }

    function viewFreshAddress() external view returns(address){return FreshToken;}

    function createNewPool(address token, address beneficiery,uint256 base,uint256 thresh,uint256 sup,address ref,address notifier)   external {
        require(!poolExists[token],"Token pool already exists");
        require(base==0 || base ==1,"Inavlid Base Pair"); //0 is native 1 is USDC
        pool p = new pool(token,beneficiery,base,sup,thresh,address(this),ref,notifier);
        allTokens.push(token);
        TokenToPool[token] = address(p);
        poolExists[token]=true;

    }

    function updateExistingPool(address token, address poolAD) external{
        require(msg.sender==admin,"You are not the admin");
        TokenToPool[token]=poolAD;
        poolExists[token]=true;
    }

    function setBountyThresh(uint256 amt) external{
        require(msg.sender==admin,"You are not the admin");
        bountyThresh=amt;
    }

    function setFreshAddress(address ad) external {
        require(msg.sender==admin,"You are not the admin");
        FreshToken=ad;
    }

    function setFees(uint256 Pfee, uint256 noTaxFee, uint256 rf,uint256 bonty) external{
        require(msg.sender==admin,"You are not the admin");
        Platformfee =Pfee;
        PlatformfeeOnNoTax=noTaxFee;
        referalFee = rf;
        bountyFee=bonty;
    }

    function approveEmergencyWithdraw(address poolAdd,uint256 action) external{
        require(msg.sender==admin,"You are not the admin");
        pool p = pool(poolAdd);
        p.approveEmergencyWithdraw(action);
    }

    function changeBeneficieryAddress(address pool_,address ben) external{
        require(msg.sender == admin,"You are not the admin");
        pool p = pool(pool_);
        p.changeBeneficieryAddress(ben);
    }

    function withdrawALLUSD() external{
        require(msg.sender==admin,"You are not the admin");
        IBEP20 USD = IBEP20(USDbase);
        USD.transfer(admin,USD.balanceOf(address(this)));
        IBEP20 NATIVE = IBEP20(nativeBase);
        NATIVE.transfer(admin, NATIVE.balanceOf(address(this)));
    }

 }
