import { ethers, upgrades } from "hardhat";
import { parseEther } from 'ethers'

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("🚀 ~ main ~ owner:", owner.address)

  /*Deploy MyToken*/
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(owner.address);
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());

  const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const seller = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  await token.mint(buyer, parseEther("200000")); // mint for buyer
  await token.mint(seller, parseEther("100000")); // mint for seller

  const balanceBuyer = await token.balanceOf(buyer);
  const balanceSeller = await token.balanceOf(seller);

  console.log("Buyer balance:", ethers.formatEther(balanceBuyer));
  console.log("Seller balance:", ethers.formatEther(balanceSeller));


  /*Deploy TrainingNFT*/
  const traningNFT = await ethers.getContractFactory("TrainingNFT");
  const traning = await traningNFT.deploy(owner.address);
  await traning.waitForDeployment();
  console.log("Token deployed to:", await traning.getAddress());

  const marketPlace = await ethers.getContractFactory("MarketPlace");
  const marketPlaceContract = await marketPlace.deploy();
  await marketPlaceContract.waitForDeployment();
  console.log("MarketPlace deployed to:", await marketPlaceContract.getAddress());

  // private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  
  await traning.safeMint('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 1);
  await traning.safeMint('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 2);
  await traning.safeMint('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 3);

  await traning.safeMint(owner.address, 4);
  await traning.safeMint(owner.address, 5);
  await traning.safeMint(owner.address, 6);

  await traning.safeMint(owner.address, 7);
  await traning.safeMint(owner.address, 8);
  await traning.safeMint(owner.address, 9);

  await traning.setApprovalForAll(marketPlaceContract.target, true);


  await owner.sendTransaction({
    to: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    value: ethers.parseEther('10')
  })

  const nativeTokenAddress = ethers.ZeroAddress;

  const myTokenAddress = token.getAddress();

  await marketPlaceContract.list(traning.target, 4, parseEther("4"), nativeTokenAddress);
  await marketPlaceContract.list(traning.target, 5, parseEther("5"), nativeTokenAddress);
  await marketPlaceContract.list(traning.target, 6, parseEther("6"), nativeTokenAddress);


  await marketPlaceContract.list(traning.target, 7, parseEther("7"), myTokenAddress);
  await marketPlaceContract.list(traning.target, 8, parseEther("8"), myTokenAddress);
  await marketPlaceContract.list(traning.target, 9, parseEther("9"), myTokenAddress);

  await marketPlaceContract.connect(owner).cancelListing(traning.target, 4);

  var listing = await marketPlaceContract.getListingByPage(0, 10);
  console.log("🚀 ~ main ~ listing:", listing);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
