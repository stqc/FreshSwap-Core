pragma solidity >=0.8.0;

//SPDX-License-Identifier: UNLICENSED

import "./bep20.sol";
import "./poolMethods.sol";

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

contract FSRouter{

    address public immutable WETH;

    constructor(address weth){
        WETH=weth;
    }

    function wrapAndBuy(address pool,address tk) external payable{
         IWETH(WETH).deposit{value:msg.value}();
         poolMethods Pool = poolMethods(pool);
         IBEP20(WETH).approve(pool, msg.value);
         Pool.buyToken_Qdy(msg.value,msg.sender);
         IBEP20 token = IBEP20(tk);
         token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function sellAndUnwrap( address pool, address tk, uint256 amount) external payable {
        IBEP20(tk).transferFrom(msg.sender,address(this),amount);
        poolMethods Pool = poolMethods(pool);
        IBEP20(tk).approve(pool, amount);
        Pool.sellToken_qLx(amount,msg.sender);
        IWETH(WETH).withdraw(IBEP20(WETH).balanceOf(address(this)));
        (bool check,)=address(msg.sender).call{value:address(this).balance}("");
        require(check,"tx failed");

    }


    receive() external payable{

    }




}