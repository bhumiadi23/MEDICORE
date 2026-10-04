const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('DrugSupplyChain', function () {
  let contract, owner, admin, mfr, qao, whl, trn, ret;

  before(async function () {
    [owner, admin, mfr, qao, whl, trn, ret] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('DrugSupplyChain');
    contract = await Factory.deploy();
  });

  it('Should register entities', async function () {
    await contract.connect(mfr).registerEntity('Manufacturer', 'MFR-001', 1);
    await contract.connect(qao).registerEntity('Quality Officer', 'QAO-001', 7);
    await contract.connect(whl).registerEntity('Wholesaler', 'WHL-001', 2);
    await contract.connect(trn).registerEntity('Transporter', 'TRN-001', 5);
    
    const m = await contract.getEntityById('MFR-001');
    
    expect(m.isRegistered).to.be.true;
  });

  it('Should manufacture a batch', async function () {
    await contract.connect(mfr)['manufactureDrug(string,string,uint256,uint256,uint256)']('Paracetamol', 'BATCH-001', 1000, 1690000000, 1893456000);
    const drug = await contract.getDrug('BATCH-001');
    expect(drug.drugName).to.equal('Paracetamol');
    expect(drug.manufacturedQty).to.equal(1000n);
    expect(drug.remainingQty).to.equal(1000n);
  });

  it('Should approve quality', async function () {
    await contract.connect(qao).approveDrug('BATCH-001', 'Looks good');
    const drug = await contract.getDrug('BATCH-001');
    expect(drug.status).to.equal(3n); // AVAILABLE
  });

  it('Should create a shipment (Quantity Conservation)', async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes('MED-1234'));
    await contract.connect(mfr).createShipment('SHP-001', 'BATCH-001', 400, 'MFR-001', 'WHL-001', 'TRN-001', hash);
    
    const drug = await contract.getDrug('BATCH-001');
    expect(drug.remainingQty).to.equal(600n); // 1000 - 400 = 600
  });

  it('Should receive shipment', async function () {
    await contract.connect(whl).receiveShipment('SHP-001', 'MED-1234');
    const shipment = await contract.getShipment('SHP-001');
    expect(shipment.status).to.equal(4n); // DELIVERED
  });

  it('Should suspend entity and block actions', async function () {
    await contract.connect(owner).suspendEntity('MFR-001');
    await expect(
      contract.connect(mfr)['manufactureDrug(string,string,uint256,uint256,uint256)']('Aspirin', 'BATCH-002', 500, 1690000000, 1893456000)
    ).to.be.revertedWith('Entity is suspended');
  });
});
