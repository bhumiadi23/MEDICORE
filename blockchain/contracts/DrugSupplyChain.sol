// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DrugSupplyChain is ReentrancyGuard {

    // ─────────────────────────────────────────────────────────────────────────
    // ENUMS
    // ─────────────────────────────────────────────────────────────────────────

    enum Role {
        None,           // 0
        Manufacturer,   // 1
        Wholesaler,     // 2
        Retailer,       // 3
        Customer,       // 4
        Transporter,    // 5
        Regulator,      // 6
        QualityOfficer  // 7
    }

    enum DrugStatus {
        CREATED,               // 0
        QUALITY_PENDING,       // 1
        QUALITY_APPROVED,      // 2
        AVAILABLE,             // 3
        IN_TRANSIT,            // 4
        DELIVERED,             // 5
        FLAGGED,               // 6
        QUARANTINED,           // 7
        UNDER_INVESTIGATION,   // 8
        RELEASED,              // 9
        RECALLED,              // 10
        EXPIRED,               // 11
        SOLD                   // 12
    }

    enum ShipmentStatus {
        PREPARING,   // 0
        DISPATCHED,  // 1
        IN_TRANSIT,  // 2
        ARRIVED,     // 3
        DELIVERED,   // 4
        DELAYED,     // 5
        QUARANTINED  // 6
    }

    enum RecallStatus {
        REQUESTED,     // 0
        UNDER_REVIEW,  // 1
        APPROVED,      // 2
        ACTIVE,        // 3
        COMPLETED      // 4
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRUCTS
    // ─────────────────────────────────────────────────────────────────────────

    struct Entity {
        string  name;
        string  id;
        Role    role;
        address wallet;
        bool    isRegistered;
        bool    isActive;
        uint256 registeredAt;
    }

    struct DrugBatch {
        string   drugName;
        string   drugId;
        string   manufacturerId;
        address  manufacturerWallet;
        uint256  manufacturedQty;
        uint256  remainingQty;
        uint256  manufacturingDate;
        uint256  expiryDate;
        bool     isRecalled;
        string   recallReason;
        bool     exists;
        uint256  createdAt;
        
        string   genericName;
        string   brandName;
        string   batchNumber;
        uint256  mrp;
        string   dosage;
        string   storageRequirement;
        string   origin;
        address  currentOwner;
        string   currentOwnerId;
        DrugStatus status;
        int256   minTemp;
        int256   maxTemp;
        string   ipfsCertificateHash;
    }

    struct DrugTransaction {
        string   drugId;
        string   fromId;
        string   toId;
        Role     fromRole;
        Role     toRole;
        uint256  quantity;
        uint256  timestamp;
        address  fromWallet;
        address  toWallet;
    }

    struct InventorySlot {
        string   drugId;
        string   drugName;
        uint256  receivedQty;
        uint256  availableQty;
        uint256  suppliedQty;
        bool     exists;
    }

    struct CustomerDrug {
        string   drugId;
        string   drugName;
        uint256  quantity;
        string   fromRetailerId;
        uint256  receivedAt;
    }

    struct Shipment {
        string shipmentId;
        string drugId;
        uint256 quantity;
        string sourceId;
        string destinationId;
        string transporterId;
        address transporterWallet;
        uint256 departureTime;
        uint256 expectedArrival;
        uint256 actualArrival;
        ShipmentStatus status;
        bool exists;
    }

    struct QualityApproval {
        string drugId;
        address officer;
        string officerId;
        bool approved;
        string comments;
        uint256 timestamp;
    }

    struct RecallRequest {
        string drugId;
        string reason;
        address initiator;
        string initiatorId;
        uint256 timestamp;
        uint8 approvalCount;
        RecallStatus status;
        bool exists;
    }

    struct EnvironmentalViolation {
        string drugId;
        string shipmentId;
        int256 recordedTemp;
        int256 minAllowed;
        int256 maxAllowed;
        uint256 timestamp;
        string reportedBy;
    }

    struct Document {
        string drugId;
        string docType;
        string ipfsCid;
        address uploader;
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;

    mapping(address => Entity)  private entityByWallet;
    mapping(string  => Entity)  private entityById;
    mapping(string  => address) private walletById;
    address[]                   private allEntityWallets;

    mapping(string => DrugBatch) private drugs;
    string[]                     private allDrugIds;

    mapping(address => mapping(string => InventorySlot)) private wholesalerInventory;
    mapping(address => string[]) private wholesalerDrugIds;

    mapping(address => mapping(string => InventorySlot)) private retailerInventory;
    mapping(address => string[]) private retailerDrugIds;
    
    mapping(address => mapping(string => InventorySlot)) private transporterInventory;
    mapping(address => string[]) private transporterDrugIds;

    mapping(string => CustomerDrug[]) private customerInventory;
    mapping(string => DrugTransaction[]) private drugHistory;

    mapping(string => Shipment) private shipments;
    mapping(address => string[]) private transporterShipmentIds;

    mapping(string => QualityApproval) private qualityApprovals;
    
    mapping(string => RecallRequest) private recallRequests;
    mapping(string => mapping(address => bool)) private recallApprovals;

    mapping(string => EnvironmentalViolation[]) private environmentalViolations;
    mapping(string => Document[]) private drugDocuments;

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    event EntityRegistered(address indexed wallet, string id, Role role, string name);
    event EntitySuspended(string id, address indexed wallet);
    event EntityActivated(string id, address indexed wallet);

    event DrugCreated(string indexed drugId, string drugName, string manufacturerId, uint256 quantity, DrugStatus status);
    event DrugManufactured(string indexed drugId, string drugName, string manufacturerId, uint256 quantity, uint256 expiryDate);
    event DrugStatusChanged(string indexed drugId, DrugStatus oldStatus, DrugStatus newStatus, address changedBy);

    event SuppliedToWholesaler(string indexed drugId, string fromManufacturerId, string toWholesalerId, uint256 quantity, uint256 timestamp);
    event SuppliedToRetailer(string indexed drugId, string fromWholesalerId, string toRetailerId, uint256 quantity, uint256 timestamp);
    event SuppliedToCustomer(string indexed drugId, string fromRetailerId, string toCustomerId, uint256 quantity, uint256 timestamp);

    event DrugRecalled(string indexed drugId, string reason, uint256 timestamp);

    event QualityApproved(string indexed drugId, string officerId, uint256 timestamp);
    event QualityRejected(string indexed drugId, string officerId, string reason, uint256 timestamp);

    event ShipmentCreated(string indexed shipmentId, string indexed drugId, string transporterId);
    event ShipmentStatusChanged(string indexed shipmentId, ShipmentStatus oldStatus, ShipmentStatus newStatus);

    event TemperatureViolation(string indexed drugId, string shipmentId, int256 recordedTemp, uint256 timestamp);
    event DrugFlagged(string indexed drugId, string reason, uint256 timestamp);
    event DrugQuarantined(string indexed drugId, string reason, uint256 timestamp);
    event DrugReleased(string indexed drugId, uint256 timestamp);

    event RecallRequested(string indexed drugId, string initiatorId, string reason);
    event RecallApproved(string indexed drugId, uint8 approverCount);

    event DocumentAdded(string indexed drugId, string docType, string ipfsCid);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the contract owner");
        _;
    }

    modifier onlyRegistered() {
        require(entityByWallet[msg.sender].isRegistered, "Caller is not registered");
        _;
    }

    modifier onlyRole(Role _role) {
        require(entityByWallet[msg.sender].isRegistered, "Caller is not registered");
        require(entityByWallet[msg.sender].role == _role, "Unauthorized role");
        _;
    }

    modifier onlyActive() {
        require(entityByWallet[msg.sender].isActive, "Entity is suspended");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTITY MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    function registerEntity(
        string calldata _name,
        string calldata _id,
        Role _role
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_id).length > 0, "ID cannot be empty");
        require(_role != Role.None, "Role.None is not allowed");
        require(!entityByWallet[msg.sender].isRegistered, "Wallet already registered");
        require(!entityById[_id].isRegistered, "Entity ID already taken");

        Entity memory e = Entity({
            name: _name,
            id: _id,
            role: _role,
            wallet: msg.sender,
            isRegistered: true,
            isActive: true,
            registeredAt: block.timestamp
        });

        entityByWallet[msg.sender] = e;
        entityById[_id] = e;
        walletById[_id] = msg.sender;
        allEntityWallets.push(msg.sender);

        emit EntityRegistered(msg.sender, _id, _role, _name);
    }

    function suspendEntity(string calldata _id) external onlyOwner {
        require(entityById[_id].isRegistered, "Entity not found");
        entityById[_id].isActive = false;
        entityByWallet[walletById[_id]].isActive = false;
        emit EntitySuspended(_id, walletById[_id]);
    }

    function activateEntity(string calldata _id) external onlyOwner {
        require(entityById[_id].isRegistered, "Entity not found");
        entityById[_id].isActive = true;
        entityByWallet[walletById[_id]].isActive = true;
        emit EntityActivated(_id, walletById[_id]);
    }

    function getEntityByWallet(address _wallet) external view returns (Entity memory) {
        return entityByWallet[_wallet];
    }

    function getEntityById(string calldata _id) external view returns (Entity memory) {
        return entityById[_id];
    }

    function isEntityRegistered(address _wallet) external view returns (bool) {
        return entityByWallet[_wallet].isRegistered;
    }

    function getAllEntities() external view returns (Entity[] memory) {
        Entity[] memory list = new Entity[](allEntityWallets.length);
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            list[i] = entityByWallet[allEntityWallets[i]];
        }
        return list;
    }

    function getEntitiesByRole(Role _role) external view returns (Entity[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            if (entityByWallet[allEntityWallets[i]].role == _role) count++;
        }
        Entity[] memory list = new Entity[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allEntityWallets.length; i++) {
            if (entityByWallet[allEntityWallets[i]].role == _role) {
                list[idx++] = entityByWallet[allEntityWallets[i]];
            }
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG MANUFACTURING
    // ─────────────────────────────────────────────────────────────────────────

    function manufactureDrug(
        string calldata _drugName,
        string calldata _drugId,
        uint256 _quantity,
        uint256 _manufacturingDate,
        uint256 _expiryDate,
        string calldata _genericName,
        string calldata _brandName,
        string calldata _batchNumber,
        uint256 _mrp,
        string calldata _dosage,
        string calldata _storageRequirement,
        string calldata _origin,
        int256 _minTemp,
        int256 _maxTemp,
        string calldata _ipfsCertificateHash
    ) external onlyRole(Role.Manufacturer) onlyActive nonReentrant {
        require(bytes(_drugName).length > 0, "Drug name cannot be empty");
        require(bytes(_drugId).length > 0, "Drug ID cannot be empty");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(!drugs[_drugId].exists, "Drug ID already exists");
        require(_expiryDate > _manufacturingDate, "Expiry must be after manufacturing date");
        require(_expiryDate > block.timestamp, "Expiry date is already in the past");

        Entity storage mfr = entityByWallet[msg.sender];

        drugs[_drugId] = DrugBatch({
            drugName: _drugName,
            drugId: _drugId,
            manufacturerId: mfr.id,
            manufacturerWallet: msg.sender,
            manufacturedQty: _quantity,
            remainingQty: _quantity,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            isRecalled: false,
            recallReason: "",
            exists: true,
            createdAt: block.timestamp,
            genericName: _genericName,
            brandName: _brandName,
            batchNumber: _batchNumber,
            mrp: _mrp,
            dosage: _dosage,
            storageRequirement: _storageRequirement,
            origin: _origin,
            currentOwner: msg.sender,
            currentOwnerId: mfr.id,
            status: DrugStatus.CREATED,
            minTemp: _minTemp,
            maxTemp: _maxTemp,
            ipfsCertificateHash: _ipfsCertificateHash
        });

        allDrugIds.push(_drugId);
        
        _updateDrugStatus(_drugId, DrugStatus.QUALITY_PENDING);

        emit DrugManufactured(_drugId, _drugName, mfr.id, _quantity, _expiryDate);
        emit DrugCreated(_drugId, _drugName, mfr.id, _quantity, DrugStatus.QUALITY_PENDING);
    }

    // Overload for backward compatibility if called without extra params
    function manufactureDrug(
        string calldata _drugName,
        string calldata _drugId,
        uint256 _quantity,
        uint256 _manufacturingDate,
        uint256 _expiryDate
    ) external onlyRole(Role.Manufacturer) onlyActive nonReentrant {
        require(bytes(_drugName).length > 0, "Drug name cannot be empty");
        require(bytes(_drugId).length > 0, "Drug ID cannot be empty");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(!drugs[_drugId].exists, "Drug ID already exists");
        require(_expiryDate > _manufacturingDate, "Expiry must be after manufacturing date");
        require(_expiryDate > block.timestamp, "Expiry date is already in the past");

        Entity storage mfr = entityByWallet[msg.sender];

        drugs[_drugId] = DrugBatch({
            drugName: _drugName,
            drugId: _drugId,
            manufacturerId: mfr.id,
            manufacturerWallet: msg.sender,
            manufacturedQty: _quantity,
            remainingQty: _quantity,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            isRecalled: false,
            recallReason: "",
            exists: true,
            createdAt: block.timestamp,
            genericName: "",
            brandName: "",
            batchNumber: "",
            mrp: 0,
            dosage: "",
            storageRequirement: "",
            origin: "",
            currentOwner: msg.sender,
            currentOwnerId: mfr.id,
            status: DrugStatus.CREATED,
            minTemp: 0,
            maxTemp: 0,
            ipfsCertificateHash: ""
        });

        allDrugIds.push(_drugId);
        
        _updateDrugStatus(_drugId, DrugStatus.QUALITY_PENDING);

        emit DrugManufactured(_drugId, _drugName, mfr.id, _quantity, _expiryDate);
        emit DrugCreated(_drugId, _drugName, mfr.id, _quantity, DrugStatus.QUALITY_PENDING);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUALITY APPROVAL
    // ─────────────────────────────────────────────────────────────────────────

    function approveDrug(string calldata _drugId, string calldata _comments) external onlyRole(Role.QualityOfficer) onlyActive nonReentrant {
        require(drugs[_drugId].exists, "Drug does not exist");
        require(drugs[_drugId].status == DrugStatus.QUALITY_PENDING, "Drug not in QUALITY_PENDING state");

        Entity storage officer = entityByWallet[msg.sender];

        qualityApprovals[_drugId] = QualityApproval({
            drugId: _drugId,
            officer: msg.sender,
            officerId: officer.id,
            approved: true,
            comments: _comments,
            timestamp: block.timestamp
        });

        _updateDrugStatus(_drugId, DrugStatus.QUALITY_APPROVED);
        _updateDrugStatus(_drugId, DrugStatus.AVAILABLE);

        emit QualityApproved(_drugId, officer.id, block.timestamp);
    }

    function rejectDrug(string calldata _drugId, string calldata _comments) external onlyRole(Role.QualityOfficer) onlyActive nonReentrant {
        require(drugs[_drugId].exists, "Drug does not exist");
        require(drugs[_drugId].status == DrugStatus.QUALITY_PENDING, "Drug not in QUALITY_PENDING state");

        Entity storage officer = entityByWallet[msg.sender];

        qualityApprovals[_drugId] = QualityApproval({
            drugId: _drugId,
            officer: msg.sender,
            officerId: officer.id,
            approved: false,
            comments: _comments,
            timestamp: block.timestamp
        });

        _updateDrugStatus(_drugId, DrugStatus.FLAGGED);

        emit QualityRejected(_drugId, officer.id, _comments, block.timestamp);
    }

    function getQualityApproval(string calldata _drugId) external view returns (QualityApproval memory) {
        return qualityApprovals[_drugId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHIPMENT TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    function createShipment(
        string calldata _shipmentId,
        string calldata _drugId,
        uint256 _quantity,
        string calldata _sourceId,
        string calldata _destinationId,
        string calldata _transporterId
    ) external onlyRegistered onlyActive nonReentrant {
        require(!shipments[_shipmentId].exists, "Shipment already exists");
        require(drugs[_drugId].exists, "Drug does not exist");
        require(drugs[_drugId].status == DrugStatus.AVAILABLE || drugs[_drugId].status == DrugStatus.DELIVERED, "Drug not available for shipment");
        require(entityById[_transporterId].role == Role.Transporter, "Invalid transporter");
        
        address transporterWallet = walletById[_transporterId];

        shipments[_shipmentId] = Shipment({
            shipmentId: _shipmentId,
            drugId: _drugId,
            quantity: _quantity,
            sourceId: _sourceId,
            destinationId: _destinationId,
            transporterId: _transporterId,
            transporterWallet: transporterWallet,
            departureTime: block.timestamp,
            expectedArrival: 0,
            actualArrival: 0,
            status: ShipmentStatus.PREPARING,
            exists: true
        });

        transporterShipmentIds[transporterWallet].push(_shipmentId);
        
        emit ShipmentCreated(_shipmentId, _drugId, _transporterId);
    }

    function updateShipmentStatus(string calldata _shipmentId, ShipmentStatus _newStatus) external onlyRole(Role.Transporter) onlyActive nonReentrant {
        require(shipments[_shipmentId].exists, "Shipment does not exist");
        require(shipments[_shipmentId].transporterWallet == msg.sender, "Not the transporter of this shipment");
        
        ShipmentStatus oldStatus = shipments[_shipmentId].status;
        shipments[_shipmentId].status = _newStatus;
        
        string memory drugId = shipments[_shipmentId].drugId;
        
        if (_newStatus == ShipmentStatus.DISPATCHED || _newStatus == ShipmentStatus.IN_TRANSIT) {
            _updateDrugStatus(drugId, DrugStatus.IN_TRANSIT);
        } else if (_newStatus == ShipmentStatus.QUARANTINED) {
            _updateDrugStatus(drugId, DrugStatus.QUARANTINED);
        }

        emit ShipmentStatusChanged(_shipmentId, oldStatus, _newStatus);
    }

    function completeShipment(string calldata _shipmentId) external onlyRole(Role.Transporter) onlyActive nonReentrant {
        require(shipments[_shipmentId].exists, "Shipment does not exist");
        require(shipments[_shipmentId].transporterWallet == msg.sender, "Not the transporter of this shipment");
        require(shipments[_shipmentId].status != ShipmentStatus.DELIVERED, "Shipment already delivered");
        
        ShipmentStatus oldStatus = shipments[_shipmentId].status;
        shipments[_shipmentId].status = ShipmentStatus.DELIVERED;
        shipments[_shipmentId].actualArrival = block.timestamp;
        
        _updateDrugStatus(shipments[_shipmentId].drugId, DrugStatus.DELIVERED);

        emit ShipmentStatusChanged(_shipmentId, oldStatus, ShipmentStatus.DELIVERED);
    }

    function getShipment(string calldata _shipmentId) external view returns (Shipment memory) {
        require(shipments[_shipmentId].exists, "Shipment does not exist");
        return shipments[_shipmentId];
    }

    function getShipmentsByTransporter(address _transporterAddress) external view returns (Shipment[] memory) {
        string[] storage ids = transporterShipmentIds[_transporterAddress];
        Shipment[] memory list = new Shipment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = shipments[ids[i]];
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO WHOLESALER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToWholesaler(
        string calldata _drugId,
        string calldata _wholesalerId,
        uint256 _quantity
    ) external onlyRole(Role.Manufacturer) onlyActive nonReentrant {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(drugs[_drugId].exists, "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];

        require(batch.manufacturerWallet == msg.sender, "Drug does not belong to this manufacturer");
        require(!_isDrugExpired(_drugId), "Drug is expired");
        require(!batch.isRecalled, "Drug is recalled");
        require(batch.status == DrugStatus.AVAILABLE || batch.status == DrugStatus.DELIVERED, "Drug not available for supply");
        require(batch.remainingQty >= _quantity, "Insufficient manufacturer stock");

        require(entityById[_wholesalerId].isRegistered, "Target ID is not a registered Wholesaler");
        require(entityById[_wholesalerId].role == Role.Wholesaler, "Target ID is not a registered Wholesaler");
        require(entityById[_wholesalerId].isActive, "Wholesaler is suspended");

        address wsWallet = walletById[_wholesalerId];

        batch.remainingQty -= _quantity;
        batch.currentOwner = wsWallet;
        batch.currentOwnerId = _wholesalerId;
        _updateDrugStatus(_drugId, DrugStatus.AVAILABLE);

        InventorySlot storage slot = wholesalerInventory[wsWallet][_drugId];
        if (!slot.exists) {
            wholesalerInventory[wsWallet][_drugId] = InventorySlot({
                drugId: _drugId,
                drugName: batch.drugName,
                receivedQty: _quantity,
                availableQty: _quantity,
                suppliedQty: 0,
                exists: true
            });
            wholesalerDrugIds[wsWallet].push(_drugId);
        } else {
            slot.receivedQty += _quantity;
            slot.availableQty += _quantity;
        }

        Entity storage mfr = entityByWallet[msg.sender];
        _recordTransaction(_drugId, mfr.id, _wholesalerId, Role.Manufacturer, Role.Wholesaler, _quantity, msg.sender, wsWallet);

        emit SuppliedToWholesaler(_drugId, mfr.id, _wholesalerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO RETAILER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToRetailer(
        string calldata _drugId,
        string calldata _retailerId,
        uint256 _quantity
    ) external onlyRole(Role.Wholesaler) onlyActive nonReentrant {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(drugs[_drugId].exists, "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];
        require(!_isDrugExpired(_drugId), "Drug is expired");
        require(!batch.isRecalled, "Drug is recalled");

        InventorySlot storage wsSlot = wholesalerInventory[msg.sender][_drugId];
        require(wsSlot.exists, "Wholesaler does not hold this drug");
        require(wsSlot.availableQty >= _quantity, "Insufficient wholesaler stock");

        require(entityById[_retailerId].isRegistered, "Target ID is not a registered Retailer");
        require(entityById[_retailerId].role == Role.Retailer, "Target ID is not a registered Retailer");
        require(entityById[_retailerId].isActive, "Retailer is suspended");

        address rtWallet = walletById[_retailerId];

        wsSlot.availableQty -= _quantity;
        wsSlot.suppliedQty += _quantity;

        batch.currentOwner = rtWallet;
        batch.currentOwnerId = _retailerId;
        _updateDrugStatus(_drugId, DrugStatus.AVAILABLE);

        InventorySlot storage rtSlot = retailerInventory[rtWallet][_drugId];
        if (!rtSlot.exists) {
            retailerInventory[rtWallet][_drugId] = InventorySlot({
                drugId: _drugId,
                drugName: batch.drugName,
                receivedQty: _quantity,
                availableQty: _quantity,
                suppliedQty: 0,
                exists: true
            });
            retailerDrugIds[rtWallet].push(_drugId);
        } else {
            rtSlot.receivedQty += _quantity;
            rtSlot.availableQty += _quantity;
        }

        Entity storage ws = entityByWallet[msg.sender];
        _recordTransaction(_drugId, ws.id, _retailerId, Role.Wholesaler, Role.Retailer, _quantity, msg.sender, rtWallet);

        emit SuppliedToRetailer(_drugId, ws.id, _retailerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPLY TO CUSTOMER
    // ─────────────────────────────────────────────────────────────────────────

    function supplyToCustomer(
        string calldata _drugId,
        string calldata _customerId,
        uint256 _quantity
    ) external onlyRole(Role.Retailer) onlyActive nonReentrant {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(drugs[_drugId].exists, "Drug batch does not exist");

        DrugBatch storage batch = drugs[_drugId];
        require(!_isDrugExpired(_drugId), "Drug is expired");
        require(!batch.isRecalled, "Drug is recalled");

        InventorySlot storage rtSlot = retailerInventory[msg.sender][_drugId];
        require(rtSlot.exists, "Retailer does not hold this drug");
        require(rtSlot.availableQty >= _quantity, "Insufficient retailer stock");

        require(entityById[_customerId].isRegistered, "Target ID is not a registered Customer");
        require(entityById[_customerId].role == Role.Customer, "Target ID is not a registered Customer");
        require(entityById[_customerId].isActive, "Customer is suspended");

        address custWallet = walletById[_customerId];

        rtSlot.availableQty -= _quantity;
        rtSlot.suppliedQty += _quantity;
        
        batch.currentOwner = custWallet;
        batch.currentOwnerId = _customerId;
        _updateDrugStatus(_drugId, DrugStatus.SOLD);

        Entity storage rt = entityByWallet[msg.sender];
        customerInventory[_customerId].push(CustomerDrug({
            drugId: _drugId,
            drugName: batch.drugName,
            quantity: _quantity,
            fromRetailerId: rt.id,
            receivedAt: block.timestamp
        }));

        _recordTransaction(_drugId, rt.id, _customerId, Role.Retailer, Role.Customer, _quantity, msg.sender, custWallet);

        emit SuppliedToCustomer(_drugId, rt.id, _customerId, _quantity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENVIRONMENTAL VIOLATIONS
    // ─────────────────────────────────────────────────────────────────────────

    function reportEnvironmentalViolation(
        string calldata _drugId,
        string calldata _shipmentId,
        int256 _recordedTemp
    ) external onlyRegistered onlyActive nonReentrant {
        require(drugs[_drugId].exists, "Drug does not exist");
        
        DrugBatch storage batch = drugs[_drugId];
        
        environmentalViolations[_drugId].push(EnvironmentalViolation({
            drugId: _drugId,
            shipmentId: _shipmentId,
            recordedTemp: _recordedTemp,
            minAllowed: batch.minTemp,
            maxAllowed: batch.maxTemp,
            timestamp: block.timestamp,
            reportedBy: entityByWallet[msg.sender].id
        }));

        _updateDrugStatus(_drugId, DrugStatus.FLAGGED);
        _updateDrugStatus(_drugId, DrugStatus.QUARANTINED);

        emit TemperatureViolation(_drugId, _shipmentId, _recordedTemp, block.timestamp);
        emit DrugFlagged(_drugId, "Temperature out of bounds", block.timestamp);
        emit DrugQuarantined(_drugId, "Temperature violation", block.timestamp);
    }

    function getViolations(string calldata _drugId) external view returns (EnvironmentalViolation[] memory) {
        return environmentalViolations[_drugId];
    }

    function getViolationCount(string calldata _drugId) external view returns (uint256) {
        return environmentalViolations[_drugId].length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOCUMENT REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    function addDocument(
        string calldata _drugId,
        string calldata _docType,
        string calldata _ipfsCid
    ) external onlyRegistered onlyActive nonReentrant {
        require(drugs[_drugId].exists, "Drug does not exist");

        drugDocuments[_drugId].push(Document({
            drugId: _drugId,
            docType: _docType,
            ipfsCid: _ipfsCid,
            uploader: msg.sender,
            timestamp: block.timestamp
        }));

        emit DocumentAdded(_drugId, _docType, _ipfsCid);
    }

    function getDocuments(string calldata _drugId) external view returns (Document[] memory) {
        return drugDocuments[_drugId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG STATUS & RECALL
    // ─────────────────────────────────────────────────────────────────────────

    function recallDrug(string calldata _drugId, string calldata _reason) external {
        requestRecall(_drugId, _reason);
    }

    function requestRecall(string calldata _drugId, string calldata _reason) public onlyRegistered onlyActive nonReentrant {
        require(drugs[_drugId].exists, "Drug does not exist");
        Role r = entityByWallet[msg.sender].role;
        require(r == Role.Manufacturer || r == Role.QualityOfficer || r == Role.Regulator, "Not authorized to request recall");
        require(!drugs[_drugId].isRecalled, "Drug is already recalled");
        require(!recallRequests[_drugId].exists, "Recall request already exists");

        Entity storage init = entityByWallet[msg.sender];

        recallRequests[_drugId].exists = true;
        recallRequests[_drugId].drugId = _drugId;
        recallRequests[_drugId].reason = _reason;
        recallRequests[_drugId].initiator = msg.sender;
        recallRequests[_drugId].initiatorId = init.id;
        recallRequests[_drugId].timestamp = block.timestamp;
        recallRequests[_drugId].approvalCount = 1;
        recallRequests[_drugId].status = RecallStatus.REQUESTED;

        recallApprovals[_drugId][msg.sender] = true;

        emit RecallRequested(_drugId, init.id, _reason);
    }

    function approveRecall(string calldata _drugId) external onlyRegistered onlyActive nonReentrant {
        require(recallRequests[_drugId].exists, "Recall request does not exist");
        require(recallRequests[_drugId].status != RecallStatus.COMPLETED && recallRequests[_drugId].status != RecallStatus.ACTIVE, "Recall already processed");
        
        Role r = entityByWallet[msg.sender].role;
        require(r == Role.Manufacturer || r == Role.QualityOfficer || r == Role.Regulator, "Not authorized to approve recall");
        
        Role initRole = entityByWallet[recallRequests[_drugId].initiator].role;
        require(r != initRole || msg.sender != recallRequests[_drugId].initiator, "Different role or entity required to approve");
        require(!recallApprovals[_drugId][msg.sender], "Already approved");

        recallApprovals[_drugId][msg.sender] = true;
        recallRequests[_drugId].approvalCount++;
        
        emit RecallApproved(_drugId, recallRequests[_drugId].approvalCount);

        if (recallRequests[_drugId].approvalCount >= 2) {
            recallRequests[_drugId].status = RecallStatus.APPROVED;
            _executeRecall(_drugId, recallRequests[_drugId].reason);
        }
    }

    function getRecallInfo(string calldata _drugId) external view returns (RecallRequest memory) {
        return recallRequests[_drugId];
    }

    function _executeRecall(string memory _drugId, string memory _reason) internal {
        DrugBatch storage batch = drugs[_drugId];
        batch.isRecalled = true;
        batch.recallReason = _reason;
        recallRequests[_drugId].status = RecallStatus.ACTIVE;
        
        _updateDrugStatus(_drugId, DrugStatus.RECALLED);
        
        emit DrugRecalled(_drugId, _reason, block.timestamp);
    }

    function isDrugExpired(string calldata _drugId) external view returns (bool) {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        return _isDrugExpired(_drugId);
    }

    function getDrugStatus(string calldata _drugId) external view returns (DrugStatus) {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        if (drugs[_drugId].isRecalled) return DrugStatus.RECALLED;
        if (_isDrugExpired(_drugId)) return DrugStatus.EXPIRED;
        return drugs[_drugId].status;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getDrug(string calldata _drugId) external view returns (DrugBatch memory) {
        require(drugs[_drugId].exists, "Drug batch does not exist");
        return drugs[_drugId];
    }

    function getAllDrugs() external view returns (DrugBatch[] memory) {
        DrugBatch[] memory list = new DrugBatch[](allDrugIds.length);
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            list[i] = drugs[allDrugIds[i]];
        }
        return list;
    }

    function getDrugCount() external view returns (uint256) {
        return allDrugIds.length;
    }

    struct VerifyResult {
        bool    exists;
        string  drugName;
        string  manufacturerId;
        address manufacturerWallet;
        uint256 manufacturingDate;
        uint256 expiryDate;
        bool    isExpired;
        bool    isRecalled;
        string  recallReason;
        uint256 manufacturedQty;
        uint256 remainingQty;
        string  genericName;
        string  brandName;
        string  batchNumber;
        DrugStatus status;
        string  currentOwnerId;
    }

    function verifyDrug(string calldata _drugId) external view returns (VerifyResult memory result) {
        if (!drugs[_drugId].exists) {
            return result;
        }
        DrugBatch storage b = drugs[_drugId];
        result.exists             = true;
        result.drugName           = b.drugName;
        result.manufacturerId     = b.manufacturerId;
        result.manufacturerWallet = b.manufacturerWallet;
        result.manufacturingDate  = b.manufacturingDate;
        result.expiryDate         = b.expiryDate;
        result.isExpired          = _isDrugExpired(_drugId);
        result.isRecalled         = b.isRecalled;
        result.recallReason       = b.recallReason;
        result.manufacturedQty    = b.manufacturedQty;
        result.remainingQty       = b.remainingQty;
        result.genericName        = b.genericName;
        result.brandName          = b.brandName;
        result.batchNumber        = b.batchNumber;
        result.status             = b.status;
        result.currentOwnerId     = b.currentOwnerId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INVENTORY QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getManufacturerInventory(address _wallet) external view returns (DrugBatch[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].manufacturerWallet == _wallet) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].manufacturerWallet == _wallet) {
                list[idx++] = drugs[allDrugIds[i]];
            }
        }
        return list;
    }

    function getWholesalerInventory(address _wallet) external view returns (InventorySlot[] memory) {
        string[] storage ids = wholesalerDrugIds[_wallet];
        InventorySlot[] memory list = new InventorySlot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = wholesalerInventory[_wallet][ids[i]];
        }
        return list;
    }

    function getRetailerInventory(address _wallet) external view returns (InventorySlot[] memory) {
        string[] storage ids = retailerDrugIds[_wallet];
        InventorySlot[] memory list = new InventorySlot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = retailerInventory[_wallet][ids[i]];
        }
        return list;
    }

    function getTransporterInventory(address _wallet) external view returns (InventorySlot[] memory) {
        string[] storage ids = transporterDrugIds[_wallet];
        InventorySlot[] memory list = new InventorySlot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = transporterInventory[_wallet][ids[i]];
        }
        return list;
    }

    function getCustomerInventory(string calldata _customerId) external view returns (CustomerDrug[] memory) {
        return customerInventory[_customerId];
    }

    function getCustomerDrugCount(string calldata _customerId) external view returns (uint256) {
        return customerInventory[_customerId].length;
    }

    function getCustomerDrug(string calldata _customerId, uint256 _index) external view returns (CustomerDrug memory) {
        require(_index < customerInventory[_customerId].length, "Index out of bounds");
        return customerInventory[_customerId][_index];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DRUG HISTORY QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    function getDrugHistory(string calldata _drugId) external view returns (DrugTransaction[] memory) {
        return drugHistory[_drugId];
    }

    function getDrugHistoryCount(string calldata _drugId) external view returns (uint256) {
        return drugHistory[_drugId].length;
    }

    function getDrugHistoryItem(string calldata _drugId, uint256 _index) external view returns (DrugTransaction memory) {
        require(_index < drugHistory[_drugId].length, "Index out of bounds");
        return drugHistory[_drugId][_index];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN STATS
    // ─────────────────────────────────────────────────────────────────────────

    function getTotalEntities() external view returns (uint256) {
        return allEntityWallets.length;
    }

    function getTotalDrugs() external view returns (uint256) {
        return allDrugIds.length;
    }

    function getRecalledDrugs() external view returns (DrugBatch[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].isRecalled) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (drugs[allDrugIds[i]].isRecalled) list[idx++] = drugs[allDrugIds[i]];
        }
        return list;
    }

    function getExpiredDrugs() external view returns (DrugBatch[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (_isDrugExpired(allDrugIds[i])) count++;
        }
        DrugBatch[] memory list = new DrugBatch[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDrugIds.length; i++) {
            if (_isDrugExpired(allDrugIds[i])) list[idx++] = drugs[allDrugIds[i]];
        }
        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function _isDrugExpired(string memory _drugId) internal view returns (bool) {
        return block.timestamp > drugs[_drugId].expiryDate;
    }

    function _updateDrugStatus(string memory _drugId, DrugStatus _newStatus) internal {
        DrugStatus oldStatus = drugs[_drugId].status;
        
        // Some basic validation
        if (oldStatus == DrugStatus.EXPIRED || oldStatus == DrugStatus.SOLD) {
            return;
        }
        
        if (oldStatus == DrugStatus.RECALLED && _newStatus != DrugStatus.RECALLED) {
            return;
        }

        drugs[_drugId].status = _newStatus;
        emit DrugStatusChanged(_drugId, oldStatus, _newStatus, msg.sender);
    }

    function _recordTransaction(
        string memory _drugId,
        string memory _fromId,
        string memory _toId,
        Role          _fromRole,
        Role          _toRole,
        uint256       _quantity,
        address       _fromWallet,
        address       _toWallet
    ) internal {
        drugHistory[_drugId].push(DrugTransaction({
            drugId:     _drugId,
            fromId:     _fromId,
            toId:       _toId,
            fromRole:   _fromRole,
            toRole:     _toRole,
            quantity:   _quantity,
            timestamp:  block.timestamp,
            fromWallet: _fromWallet,
            toWallet:   _toWallet
        }));
    }
}
