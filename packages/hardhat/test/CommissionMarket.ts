import { time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CommissionMarket } from "../typechain-types";

describe("CommissionMarket", function () {
  async function deployFixture() {
    const [consumer, creator, otherCreator] = await ethers.getSigners();
    const marketFactory = await ethers.getContractFactory("CommissionMarket");
    const market = (await marketFactory.deploy()) as CommissionMarket;
    await market.waitForDeployment();

    return { consumer, creator, otherCreator, market };
  }

  it("escrows a commission and records bids", async function () {
    const { consumer, creator, market } = await deployFixture();
    const maxBudget = ethers.parseEther("5");
    const bidAmount = ethers.parseEther("3");

    await expect(market.connect(consumer).createCommission("ipfs://prompt", 3600, { value: maxBudget }))
      .to.emit(market, "CommissionCreated")
      .withArgs(0, consumer.address, maxBudget, anyValue, "ipfs://prompt");

    await expect(market.connect(creator).placeBid(0, bidAmount, "https://worker.example/run"))
      .to.emit(market, "BidPlaced")
      .withArgs(0, 0, creator.address, bidAmount, "https://worker.example/run");

    expect(await market.getBidCount(0)).to.equal(1);

    const bid = await market.getBid(0, 0);
    expect(bid.creator).to.equal(creator.address);
    expect(bid.amount).to.equal(bidAmount);
    expect(bid.endpointURI).to.equal("https://worker.example/run");
  });

  it("auto-selects the lowest bid after the deadline and pays on delivery", async function () {
    const { consumer, creator, otherCreator, market } = await deployFixture();
    const maxBudget = ethers.parseEther("5");
    const winningBid = ethers.parseEther("2");
    const losingBid = ethers.parseEther("3");

    await market.connect(consumer).createCommission("ipfs://prompt", 3600, { value: maxBudget });
    await market.connect(otherCreator).placeBid(0, losingBid, "https://expensive.example/run");
    await market.connect(creator).placeBid(0, winningBid, "https://fast.example/run");

    await time.increase(3601);

    await expect(market.connect(otherCreator).finalizeLowestBid(0))
      .to.emit(market, "BidAccepted")
      .withArgs(0, 1, creator.address, winningBid);

    await expect(market.connect(creator).submitDelivery(0, "ipfs://result")).to.changeEtherBalances(
      [market, creator, consumer],
      [-maxBudget, winningBid, maxBudget - winningBid],
    );

    await expect(market.connect(creator).submitDelivery(0, "ipfs://result-2")).to.be.revertedWithCustomError(
      market,
      "NotAssigned",
    );

    const commission = await market.getCommission(0);
    expect(commission.status).to.equal(3);
    expect(commission.resultURI).to.equal("ipfs://result");
  });

  it("settles an expired commission by accepting the lowest bid", async function () {
    const { consumer, creator, otherCreator, market } = await deployFixture();
    const maxBudget = ethers.parseEther("5");
    const winningBid = ethers.parseEther("2");
    const losingBid = ethers.parseEther("3");

    await market.connect(consumer).createCommission("ipfs://prompt", 10, { value: maxBudget });
    await market.connect(otherCreator).placeBid(0, losingBid, "https://expensive.example/run");
    await market.connect(creator).placeBid(0, winningBid, "https://fast.example/run");
    await time.increase(11);

    await expect(market.connect(otherCreator).settleExpiredCommission(0))
      .to.emit(market, "BidAccepted")
      .withArgs(0, 1, creator.address, winningBid);

    const commission = await market.getCommission(0);
    expect(commission.status).to.equal(1);
    expect(commission.creator).to.equal(creator.address);
    expect(commission.acceptedAmount).to.equal(winningBid);
  });

  it("settles an expired commission by cancelling and refunding when there are no bids", async function () {
    const { consumer, otherCreator, market } = await deployFixture();
    const maxBudget = ethers.parseEther("1");

    await market.connect(consumer).createCommission("ipfs://prompt", 10, { value: maxBudget });
    await time.increase(11);

    await expect(market.connect(otherCreator).settleExpiredCommission(0)).to.changeEtherBalances(
      [market, consumer],
      [-maxBudget, maxBudget],
    );

    await expect(market.connect(otherCreator).settleExpiredCommission(0)).to.be.revertedWithCustomError(
      market,
      "NotOpen",
    );

    const commission = await market.getCommission(0);
    expect(commission.status).to.equal(4);
  });

  it("still allows the consumer to manually accept a bid after the deadline", async function () {
    const { consumer, creator, market } = await deployFixture();
    const maxBudget = ethers.parseEther("1");
    const bidAmount = ethers.parseEther("0.75");

    await market.connect(consumer).createCommission("ipfs://prompt", 3600, { value: maxBudget });
    await market.connect(creator).placeBid(0, bidAmount, "https://worker.example/run");
    await time.increase(3601);

    await expect(market.connect(consumer).acceptBid(0, 0))
      .to.emit(market, "BidAccepted")
      .withArgs(0, 0, creator.address, bidAmount);

    await expect(market.connect(creator).submitDelivery(0, "ipfs://result"))
      .to.emit(market, "DeliverySubmitted")
      .withArgs(0, creator.address, "ipfs://result", anyValue);
  });

  it("lets the consumer cancel an unassigned commission after bidding closes", async function () {
    const { consumer, market } = await deployFixture();
    const maxBudget = ethers.parseEther("1");

    await market.connect(consumer).createCommission("ipfs://prompt", 3600, { value: maxBudget });
    await time.increase(3601);

    await expect(market.connect(consumer).cancelOpenCommission(0)).to.changeEtherBalances(
      [market, consumer],
      [-maxBudget, maxBudget],
    );

    const commission = await market.getCommission(0);
    expect(commission.status).to.equal(4);
  });
});
