pragma solidity >=0.8.0;

//SPDX-License-Identifier: UNLICENSED
import "./bep20.sol";

contract FreshStake{

bool lock;
uint256 public emissionPerBlock;
uint256 public startBlock;
uint256 public totalAmountStaked;
uint256 lastTotalRewardPoints;
uint256 lastBlockChangeInSupply;
uint256 public endBlock;
uint256 public totalRewardTokens;
address public rewardsAddress;
address public assetToStakeAddress;
mapping(address=>uint256) public individualStake;
mapping(address=>uint256) public lastRewardPoint;
mapping(address=>uint256) public lastClaimBlock;
mapping(address=>uint256) public totalRewardsPaid;


 modifier protecc{
        require(!lock,"Reentrant call");
        lock = true;
        _;
        lock =false;
  }

constructor(uint256 emissions,uint256 totalReward,address rewards, address toStake){
    emissionPerBlock=emissions;
    rewardsAddress=rewards;
    assetToStakeAddress=toStake;
    startBlock=block.number;
    endBlock = totalReward/emissions;
    totalRewardTokens=totalReward;
    lastBlockChangeInSupply=startBlock;
}

function stake(uint256 amountToStake) external protecc{
    if(totalAmountStaked==0){
        endBlock=block.number+endBlock;
    }
    require(IBEP20(rewardsAddress).balanceOf(address(this))>0,"Rewards Unavailable");
    require(block.number<endBlock,"Staking has ended");

    uint256 currentBlock;
    block.number>endBlock?currentBlock=endBlock:currentBlock=block.number;
    totalAmountStaked!=0?lastTotalRewardPoints+=((emissionPerBlock*(currentBlock-lastBlockChangeInSupply)*1e18)/totalAmountStaked):lastTotalRewardPoints=0;
    IBEP20(assetToStakeAddress).transferFrom(msg.sender, address(this), amountToStake);
   if(lastClaimBlock[msg.sender]==0){
       lastClaimBlock[msg.sender]=currentBlock;
       lastRewardPoint[msg.sender]=lastTotalRewardPoints;
   }else{
    uint256 amountOwed= ((lastTotalRewardPoints-lastRewardPoint[msg.sender])*individualStake[msg.sender])/1e18;
    totalRewardsPaid[msg.sender]+=amountOwed;
    lastRewardPoint[msg.sender]=lastTotalRewardPoints;
    lastClaimBlock[msg.sender]=block.number;
    IBEP20(rewardsAddress).transfer(msg.sender,amountOwed);
   }
   lastBlockChangeInSupply=currentBlock;
   individualStake[msg.sender]+=amountToStake;
   totalAmountStaked+=amountToStake;
}

function unstake() external protecc{
    require(individualStake[msg.sender]>0,"You have nothing staked");
    uint256 currentBlock;
    block.number>endBlock?currentBlock=endBlock:currentBlock=block.number;
    lastTotalRewardPoints+=((emissionPerBlock*(currentBlock-lastBlockChangeInSupply)*1e18)/totalAmountStaked);
    
    lastBlockChangeInSupply=currentBlock;
    
    uint256 amountOwed= ((lastTotalRewardPoints-lastRewardPoint[msg.sender])*individualStake[msg.sender])/1e18;
    totalRewardsPaid[msg.sender]+=amountOwed;
    lastRewardPoint[msg.sender]=0;
    lastClaimBlock[msg.sender]=0;
    if(IBEP20(rewardsAddress).balanceOf(address(this))>0){
        IBEP20(rewardsAddress).transfer(msg.sender,amountOwed);
    }
    IBEP20(assetToStakeAddress).transfer(msg.sender,individualStake[msg.sender]);
    totalAmountStaked-=individualStake[msg.sender];
    individualStake[msg.sender]=0;
    
}

function claimReward() external protecc{
   require(IBEP20(rewardsAddress).balanceOf(address(this))>0,"Rewards Unavailable");
   uint256 currentBlock;
    block.number>endBlock?currentBlock=endBlock:currentBlock=block.number;
   uint256 totalRewards= lastTotalRewardPoints+(((currentBlock-lastBlockChangeInSupply)*emissionPerBlock*1e18)/totalAmountStaked);
   uint256 amountOwed= ((totalRewards-lastRewardPoint[msg.sender])*individualStake[msg.sender])/1e18;
   totalRewardsPaid[msg.sender]+=amountOwed;
   lastClaimBlock[msg.sender]=block.number;
   lastRewardPoint[msg.sender]=totalRewards;
   IBEP20(rewardsAddress).transfer(msg.sender,amountOwed);

}

function showReward(address ad) public view returns(uint256 amtOwed){
    uint256 currentBlock;
    block.number>endBlock?currentBlock=endBlock:currentBlock=block.number;
    uint256 amt = lastTotalRewardPoints+(((currentBlock-lastBlockChangeInSupply)*emissionPerBlock*1e18)/totalAmountStaked);
    amtOwed=(amt-lastRewardPoint[ad])*individualStake[ad];
    return amtOwed/1e18;
}

function showBlock() public view returns(uint256){
    return block.number;
}

}