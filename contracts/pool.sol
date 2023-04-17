//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;


import "./poolMethods.sol";
import "./bep20.sol";
import "./FreshSwapFactoryInterface.sol";

contract voteHelper{

    uint256 public creationDate;
    mapping(address=>bool) private voted;

    address parentContract;

    constructor(){
        creationDate=block.timestamp;
        parentContract=msg.sender;
    }

    function updateVoteStatus(address voter) public {
        require(msg.sender==parentContract);
        voted[voter]=true;
    }
    function showVoteStatus(address voter) public view returns(bool){
        return voted[voter];
    }
}

interface tokenNotification{
    function showtotalBuyTax() external view returns(uint256);
    function showtotalSaleTax() external view returns(uint256);
}

contract pool is poolMethods{
    
    bool public priceSet;
    bool public tradingEnabled=true;
    bool lock;
    address immutable public not;
    address beneficiery;
    address immutable public admin;
    address immutable public tokenAddress;
    address immutable public BaseAddress;
    address immutable public referee;
    uint256 public tokenInPool;
    uint256 public USDinPool;
    uint256 public DAOThreshold;       
    uint256 immutable creationTime;
    uint256 public yesVotes=0;
    uint256 public noVotes=0;
    uint256 private _totalSupply;
    uint256 immutable difference;
     struct OHLC{
        uint256 time;
        uint256 Open;
        uint256 Low;
        uint256 High;
        uint256 Close;
        uint256 Volume;
    }
    OHLC [] _1MinData;
    tokenNotification immutable Notify;
    factoryMethod immutable fact;
    IBEP20 immutable _USD;
    IBEP20 immutable _token;
    mapping (address => uint256) private _balances;
    mapping (address=>uint256) public invested;
   
    voteHelper helper;

    modifier protecc{
        require(!lock,"Reentrant call");
        lock = true;
        _;
        lock =false;
  }

    constructor(address token, address beneficieryA,uint256 base,uint256 supply,uint256 DAOthresh,address factoryAdd,address ref,address taxHandler){
        tokenAddress =token;
        Notify=tokenNotification(taxHandler);
        not=taxHandler;
        beneficiery = beneficieryA;
        referee=ref;
        DAOThreshold=DAOthresh;
        fact = factoryMethod(factoryAdd);
        BaseAddress =base==0?fact.showNative():fact.showUSD();
        admin = factoryAdd;
        uint256 totalBuyTax=Notify.showtotalBuyTax();
        uint256 totalSaleTax=Notify.showtotalSaleTax();
        creationTime=block.timestamp;
        _USD=IBEP20(BaseAddress);
        _token=IBEP20(token);
        difference = 18-_token.decimals();
        OHLC memory m;
        _1MinData.push(m);
        require(totalBuyTax<=300 && totalSaleTax<=300,"total tax cannot exceed 30%");
        require(DAOThreshold<=(supply*2)/100,"DAO Threshold cannot be more than 2% of the total supply");
        require(DAOThreshold>=supply/1000,"DAO Threshold cannot be that low");
    }

    modifier onlyAdminAndProjectOwner{
        require(msg.sender==beneficiery || msg.sender==admin,"You are not the project owner or admin");
        _;
    }

     modifier onlyProjectOwner{
        require(msg.sender==beneficiery ,"You are not the project owner");
        _;
    }

    modifier onlyProjectOwnerOrContract{
        require(msg.sender==beneficiery || msg.sender==not,"You are not project owner or token");
        _;
    }

    modifier onlyAdmin{
        require(msg.sender==admin ,"You are not the admin");
        _;
    }

   //DAO Methods
    event Transfer(address indexed from, address indexed to, uint256 value);

    function decimals() external pure returns (uint8) {
        return 0;
    }
    function symbol() external view returns (string memory) {
        return string(abi.encodePacked(_token.symbol(),"-FSDAO"));
    }
    function name() external view returns (string memory) {
    return string(abi.encodePacked(_token.name(),"-FSDAO"));
    }
    function totalSupply() external view returns (uint256) {
    return _totalSupply;
    }
    function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
    }
    function _mint(address account, uint256 amount) internal {
    require(account != address(0), "BEP20: mint to the zero address");

    _totalSupply = _totalSupply+amount;
    _balances[account] = _balances[account]+amount;
    emit Transfer(address(0), account, amount);
    }
    function _burn(address account, uint256 amount) internal {
    require(account != address(0), "BEP20: burn from the zero address");

    _balances[account] = _balances[account]-amount;
    _totalSupply = _totalSupply-amount;
    emit Transfer(account, address(0), amount);
    }
    //DAO methods end

    function showTokenAddress() external view override returns(address){
        return tokenAddress;
    }//show the address of the token of the pool

    function showBaseAddress() external view override returns(address){
        return BaseAddress;
    }

    function showBaseSym() external view returns(string memory){
        return IBEP20(BaseAddress).symbol();
    }

    function tokenPerUSD() public view override returns(uint256){
        return (tokenInPool*1e18)/USDinPool;
    }

    function USDPerToken() public view override returns(uint256){
         return (USDinPool*1e18)/tokenInPool;
    }

    function showTradeData() external view returns( OHLC [] memory){
            OHLC [] memory data = new OHLC[](_1MinData.length);
            for(uint256 i=0; i<_1MinData.length;i++){
                data[i]=_1MinData[i];
            }
            return data;
    }

    function skim() internal{
        if(_USD.balanceOf(address(this))>USDinPool){
            uint256 remainder = _USD.balanceOf(address(this))-USDinPool;
            _USD.transfer(admin, remainder);
        }
        if(_token.balanceOf(address(this))>tokenInPool){
            uint256 remainder = _token.balanceOf(address(this))-tokenInPool;
            _token.transfer(admin, remainder);
        }
    }

    function getTokenOut(uint256 amount)  internal view returns(uint256){
        return (((amount*tokenInPool*1e18)/USDinPool+amount)/1e18)/10**difference;
    }
    function getUSDOut(uint256 amount) internal view returns(uint256) {
        return ((amount*USDinPool*1e18)/tokenInPool)/1e18;
    }
    function calculateBuyTax(uint256 amount) internal view returns(uint256){
        return (amount*Notify.showtotalBuyTax())/1000;
    }
    function calculateSellTax(uint256 amount) internal view returns(uint256){
        return (amount*Notify.showtotalSaleTax())/1000;
    }
    function calculatePlatformFeeOnNoTax(uint256 amount) internal view returns(uint256){
        (,uint256 fee,,)=fact.showFees();
        return (amount*fee)/1000;
    }
    function calculatePlatformFeeOnTax(uint256 amount) internal view returns(uint256){
        (uint256 fee,,,) = fact.showFees();
        return (amount*fee)/100;
    }
    
    function update1mChart(uint256 time, uint256 USDPricee,uint256 volume) internal{
            uint256 len = _1MinData.length-1;
            OHLC memory current =  _1MinData[len];
            if(time-current.time>1 minutes){
                current.time = time;
                (current.Open,current.Close,current.Low,current.High) = (USDPricee,USDPricee,USDPricee,USDPricee);
                current.Volume=volume;
                _1MinData.push(current);
            }else{
                current.Close=USDPricee;
                current.Low>USDPricee?current.Low=USDPricee:current.Low=current.Low;
                current.High<USDPricee?current.High=USDPricee:current.High=current.High;
                current.Volume+=volume;
                _1MinData[len]=current;
            }
       
    }

    function buyToken_Qdy(uint256 amount) external override protecc{
        require((amount*tokenPerUSD())/1e18<(tokenInPool*85)/100,"LOW LP");
        require(tradingEnabled,"TRADE DISABLED");
  
        skim();
        IBEP20 USD=_USD;
        
        require(tokenInPool==_token.balanceOf(address(this))*10**difference && USDinPool==USD.balanceOf(address(this)),"The pool has been tampered with ");
        USD.transferFrom(msg.sender,address(this),amount);
        uint256 amountT=amount;

        uint256 finalTokensGiven;

        uint256 taxFromTheBuy;

        uint256 platformTax;

         if(viewBuyTax()==0){
            platformTax = calculatePlatformFeeOnNoTax(amountT);
            amount-=platformTax;
            taxFromTheBuy = platformTax/2;
            platformTax=platformTax/2;
        }else{
            taxFromTheBuy = calculateBuyTax(amountT);

            amount-=taxFromTheBuy;

            platformTax =calculatePlatformFeeOnTax(taxFromTheBuy);

            taxFromTheBuy -=platformTax;
        }
        
        finalTokensGiven=getTokenOut(amount);

        invested[msg.sender]+=finalTokensGiven;
       
        if(block.timestamp-(creationTime)< 30 days && referee!=address(0)){
            (,,uint256 fee,)=fact.showFees();
            uint256 refReward = (platformTax*fee)/100;
            platformTax-=refReward;
            USD.transfer(referee, refReward);
        }
        USD.transfer(admin, platformTax);
        USD.transfer(address(Notify), taxFromTheBuy);
        USDinPool=USD.balanceOf(address(this));
        _token.transfer(msg.sender,finalTokensGiven);
        tokenInPool = _token.balanceOf(address(this))*10**difference;

        update1mChart(block.timestamp, USDPerToken(),amount);
        
        if(invested[msg.sender]>DAOThreshold && _balances[msg.sender]<1){
            _mint(msg.sender, 1);
        }

    } //buy the token from the said pool

    function sellToken_qLx(uint256 amount) override external protecc {
        require((amount*USDPerToken())/1e18<(USDinPool*85)/100,"insufficient liquidity");
        require(tradingEnabled,"Trading disabled");

        skim();
        IBEP20 USD = _USD;
        require(tokenInPool==_token.balanceOf(address(this))*10**difference && USDinPool==_USD.balanceOf(address(this)),"The pool has been tampered");
        
        _token.transferFrom(msg.sender,address(this),amount);
        tokenInPool = _token.balanceOf(address(this))*10**difference;
        amount=amount*10**difference;
        uint256 amountT=amount;
        
        uint256 finalUSDToGive;
        
        uint256 taxFromTheSell;

        uint256 platformTax;

        if(amountT<=invested[msg.sender]){
            unchecked {
                invested[msg.sender]=invested[msg.sender]-amountT;
            }
        }else if(amountT>invested[msg.sender]){ 
            unchecked{
                invested[msg.sender]=0;
            }
        }

        if(viewSellTax()==0){
            platformTax = calculatePlatformFeeOnNoTax(amountT);
            amount-=platformTax;
        }else{
            taxFromTheSell = calculateSellTax(amountT);
            amount-=taxFromTheSell;
            platformTax = calculatePlatformFeeOnTax(taxFromTheSell);
            taxFromTheSell-=platformTax;
            USD.transfer(address(Notify),getUSDOut(taxFromTheSell));
        }

        finalUSDToGive = getUSDOut(amount);  
        taxFromTheSell=getUSDOut(taxFromTheSell);
        
        if(block.timestamp-creationTime< 30 days && referee!=address(0)){
            (,,uint256 fee,)=fact.showFees();
            uint256 refReward = (platformTax*fee)/100;
            platformTax-=refReward;
            USD.transfer(referee, getUSDOut(refReward));
        }

        USD.transfer(admin,getUSDOut(platformTax));
       
        USD.transfer(msg.sender,finalUSDToGive);

        USDinPool=USD.balanceOf(address(this));
                
        update1mChart(block.timestamp, USDPerToken(),finalUSDToGive);

        if(invested[msg.sender]<DAOThreshold && _balances[msg.sender]>0){
            _burn(msg.sender,1);
        }

    } //sell the token back to said pool

    function addLiquidity(uint256 tokenAmount, uint256 USDAmount) external onlyProjectOwnerOrContract {
        
        if(priceSet){
            
            uint256 tokensRequired = USDAmount*tokenPerUSD();
            
            tokenAmount = tokensRequired/1e18;
        }

        _token.transferFrom(msg.sender,address(this),tokenAmount);
        tokenInPool=_token.balanceOf(address(this))*10**difference;

        _USD.transferFrom(msg.sender,address(this),USDAmount);
        USDinPool = _USD.balanceOf(address(this));
        
        if(!priceSet){
            priceSet=true;
        }


    }

    function viewBuyTax() public view override returns (uint256){
        return Notify.showtotalBuyTax();
    } //view the buy tax

    function viewSellTax() public view override returns (uint256){
        return Notify.showtotalSaleTax();
    }//view the sell tax

    function beneficieryAddress() external view override returns(address){
        return beneficiery;
    }

    function changeBeneficieryAddress(address ben) override external onlyAdmin{
        _burn(beneficiery,1);
        beneficiery=ben;
        if(_balances[beneficiery]<1){
            _mint(beneficiery,1);
        }
    }
    function requestLPRemovalDAO() external onlyProjectOwner{
        tradingEnabled=false;
        helper = new voteHelper();
    }
    
    function vote(uint256 _vote) external{
        require(_balances[msg.sender]==1,"Not authorized");
        require(!helper.showVoteStatus(msg.sender),"voted");
        require(_vote==0||_vote==1,"Invalid");
        require(!tradingEnabled,"Voting inactive");
        helper.updateVoteStatus(msg.sender);
        if(_vote==0){
            yesVotes=yesVotes+1;
        }else{
            noVotes=noVotes+1;
        }
        if(noVotes>=(uint256(_totalSupply)/2)+1){
            tradingEnabled=true;
            yesVotes=0;
            noVotes=0;
        }
    }
    
    function removeLP() external onlyProjectOwner{
        require(yesVotes>=(uint256(_totalSupply)/2)+1);
        uint256 tokenABalance = _token.balanceOf(address(this));
        uint256 usdBalance = _USD.balanceOf(address(this));
        _token.transfer(beneficiery,tokenABalance);
        _USD.transfer(beneficiery,usdBalance);
    }

    function approveEmergencyWithdraw(uint256 action) external onlyAdmin  {
            require(block.timestamp-helper.creationDate()>3 days && !tradingEnabled);
            if(action==0){
            uint256 tokenABalance = _token.balanceOf(address(this));
            uint256 usdBalance = _USD.balanceOf(address(this));
            _token.transfer(beneficiery,tokenABalance);
            _USD.transfer(beneficiery,usdBalance);
            }else{
                 tradingEnabled=true;
                 yesVotes=0;
                 noVotes=0;
            }

    }// allow emergency withdrawl of Liquidity

    
    
}

