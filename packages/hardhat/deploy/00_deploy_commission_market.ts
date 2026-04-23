import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCommissionMarket: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("CommissionMarket", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployCommissionMarket;

deployCommissionMarket.tags = ["CommissionMarket"];
