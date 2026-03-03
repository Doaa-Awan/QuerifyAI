# Database Explorer Context

Generated: 2026-03-03T01:15:39.558Z

## Tables

- actions
- area
- company
- device
- faults
- invoicedetail
- invoiceheader
- item
- orderhead
- orderline
- policy
- quotationdetail
- quotationheader
- requesttype
- site
- slahead
- supplierorderdetail
- supplierorderheader
- tax
- tree
- tstatus
- uname
- users

## Relationships

- actions.faultid -> faults.faultid
- area.atreeid -> tree.treeid
- device.devsite -> site.ssitenum
- faults.areaint -> area.aarea
- faults.assignedtoint -> uname.unum
- faults.clearwhoint -> uname.unum
- faults.devicenumber -> device.devsite
- faults.devsite -> device.devsite
- faults.requesttypenew -> requesttype.rtid
- faults.sitenumber -> site.ssitenum
- faults.slaid -> slahead.slid
- faults.status -> tstatus.tstatus
- faults.userid -> users.uid
- invoicedetail.id_itemid -> item.iid
- invoicedetail.idfaultid -> faults.faultid
- invoicedetail.idihid -> invoiceheader.ihid
- invoicedetail.idtax_rate -> tax.taxid
- invoiceheader.ihaarea -> area.aarea
- invoiceheader.ihsitenumber -> site.ssitenum
- invoiceheader.ihuid -> users.uid
- item.isupplier -> company.cnum
- item.itaxcode -> tax.taxid
- item.itaxcodeother -> tax.taxid
- orderhead.ohcreatedby -> uname.unum
- orderhead.ohfaultid -> faults.faultid
- orderhead.ohinvoicenumber -> invoiceheader.ihid
- orderhead.ohprojectfaultid -> faults.faultid
- orderhead.ohqhid -> quotationheader.qhid
- orderhead.ohsitenum -> site.ssitenum
- orderline.olid -> orderhead.ohid
- orderline.olitem -> item.iid
- orderline.olitemlocation -> site.ssitenum
- orderline.olprojectfaultid -> faults.faultid
- orderline.olquotelineid -> quotationdetail.qdid
- orderline.olsiteid -> site.ssitenum
- orderline.olsupplier -> company.cnum
- policy.pslaid -> slahead.slid
- quotationdetail.qditemid -> item.iid
- quotationdetail.qdqhid -> quotationheader.qhid
- quotationdetail.qdsiteid -> site.ssitenum
- quotationdetail.qdsupplier -> company.cnum
- quotationheader.qhfaultid -> faults.faultid
- quotationheader.qhunum -> uname.unum
- site.sarea -> area.aarea
- supplierorderdetail.sditemid -> item.iid
- supplierorderdetail.sdolid -> orderline.olseq
- supplierorderdetail.sdolseq -> orderline.olseq
- supplierorderdetail.sdshid -> supplierorderheader.shid
- supplierorderdetail.sdsiteid -> site.ssitenum
- supplierorderdetail.sdtaxcode -> tax.taxid
- supplierorderheader.shfaultid -> faults.faultid
- supplierorderheader.shohid -> orderhead.ohid
- supplierorderheader.shsite -> site.ssitenum
- supplierorderheader.shsupplierid -> company.cnum
- supplierorderheader.shuserid -> users.uid
- users.usite -> site.ssitenum

## Table Details

### actions

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| faultid | integer | PK, FK | faults.faultid |
| actionnumber | integer | PK | - |
| actoutcome | character varying | - | - |
| who | character varying | - | - |
| whe_ | timestamp without time zone | - | - |
| note | text | - | - |
| timetaken | double precision | - | - |
| dateemailed | timestamp without time zone | - | - |
| emailbody | text | - | - |
| actionhide | boolean | - | - |

Top 10 records:

| faultid | actionnumber | actoutcome | who | whe_ | note | timetaken | dateemailed | emailbody | actionhide |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `Ticket Opened` | `Alice Johnson` | `2025-01-05T13:30:00.000Z` | `Laptop not booting after Windows update` | `0` | `null` | `null` | `false` |
| `1` | `2` | `Agent Note` | `Tom Baker` | `2025-01-05T14:00:00.000Z` | `Attempting remote diagnostic` | `0.5` | `null` | `null` | `true` |
| `2` | `1` | `Ticket Opened` | `Bob Smith` | `2025-01-06T14:00:00.000Z` | `Cannot send or receive emails since this morning` | `0` | `null` | `null` | `false` |
| `2` | `2` | `Update Sent` | `Sara Connor` | `2025-01-06T14:30:00.000Z` | `Investigating Exchange connectivity` | `0.5` | `2025-01-06T14:31:00.000Z` | `user4@example.com` | `false` |
| `3` | `1` | `Ticket Opened` | `Carol White` | `2025-01-07T15:15:00.000Z` | `Printer shows offline in print queue` | `0` | `null` | `null` | `false` |
| `3` | `2` | `Resolved` | `Mike Ross` | `2025-01-07T19:00:00.000Z` | `Reinstalled printer driver, now working` | `1.5` | `2025-01-07T19:01:00.000Z` | `user6@example.com` | `false` |
| `4` | `1` | `Ticket Opened` | `David Brown` | `2025-01-08T16:00:00.000Z` | `VPN drops every 30 minutes` | `0` | `null` | `null` | `false` |
| `4` | `2` | `Resolved` | `Anna Karev` | `2025-01-08T20:00:00.000Z` | `Updated VPN client to latest version` | `2` | `2025-01-08T20:01:00.000Z` | `user8@example.com` | `false` |
| `5` | `1` | `Ticket Opened` | `Eve Davis` | `2025-01-09T13:00:00.000Z` | `POS terminal 3 is frozen, customers waiting` | `0` | `null` | `null` | `false` |
| `6` | `1` | `Ticket Opened` | `Frank Miller` | `2025-01-10T18:00:00.000Z` | `Locked out of Windows account` | `0` | `null` | `null` | `false` |

### area

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| aarea | integer | PK | - |
| aareadesc | character varying | - | - |
| amemo | text | - | - |
| aaccountsemailaddress | character varying | - | - |
| atechnote | text | - | - |
| atreeid | integer | FK | tree.treeid |
| aisinactive | boolean | - | - |

Top 10 records:

| aarea | aareadesc | amemo | aaccountsemailaddress | atechnote | atreeid | aisinactive |
| --- | --- | --- | --- | --- | --- | --- |
| `1` | `Acme Corp` | `Key account` | `user1@example.com` | `VPN required` | `1` | `false` |
| `2` | `City Council` | `Government client` | `user2@example.com` | `On-site preferred` | `2` | `false` |
| `3` | `Greenfield Uni` | `University campus` | `user3@example.com` | `Badge access` | `3` | `false` |
| `4` | `Metro Hospital` | `Healthcare trust` | `user4@example.com` | `HIPAA compliant` | `4` | `false` |
| `5` | `Quickmart` | `Retail chain` | `user5@example.com` | `POS systems` | `5` | `false` |
| `6` | `Capital Bank` | `Finance sector` | `user6@example.com` | `PCI-DSS zone` | `6` | `false` |
| `7` | `MechWorks Ltd` | `Manufacturing plant` | `user7@example.com` | `Factory floor` | `7` | `false` |
| `8` | `Grand Hotel` | `Hospitality group` | `user8@example.com` | `Guest WiFi` | `8` | `false` |
| `9` | `FastFreight` | `Logistics firm` | `user9@example.com` | `Depot access` | `9` | `false` |
| `10` | `TechNova` | `IT company` | `user10@example.com` | `Remote ok` | `10` | `false` |

### company

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| cnum | integer | PK | - |
| cdesc | character varying | - | - |
| cphone1 | character varying | - | - |
| caddress | text | - | - |
| cemailaddress | character varying | - | - |

Top 10 records:

| cnum | cdesc | cphone1 | caddress | cemailaddress |
| --- | --- | --- | --- | --- |
| `1` | `Dell Technologies` | `555010001` | `101 Example St` | `user1@example.com` |
| `2` | `HP Inc` | `555010002` | `102 Example St` | `user2@example.com` |
| `3` | `Lenovo` | `555010003` | `103 Example St` | `user3@example.com` |
| `4` | `Microsoft` | `555010004` | `104 Example St` | `user4@example.com` |
| `5` | `Cisco Systems` | `555010005` | `105 Example St` | `user5@example.com` |
| `6` | `Apple Inc` | `555010006` | `106 Example St` | `user6@example.com` |
| `7` | `Samsung Electronics` | `555010007` | `107 Example St` | `user7@example.com` |
| `8` | `Logitech` | `555010008` | `108 Example St` | `user8@example.com` |
| `9` | `Eaton` | `555010009` | `109 Example St` | `user9@example.com` |
| `10` | `APC by Schneider` | `555010010` | `110 Example St` | `user10@example.com` |

### device

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| ddevnum | integer | PK | - |
| devsite | integer | PK, FK | site.ssitenum |
| dinvno | character varying | - | - |

Top 10 records:

| ddevnum | devsite | dinvno |
| --- | --- | --- |
| `1` | `1` | `ASSET-001` |
| `2` | `1` | `ASSET-002` |
| `3` | `2` | `ASSET-003` |
| `4` | `2` | `ASSET-004` |
| `5` | `3` | `ASSET-005` |
| `6` | `3` | `ASSET-006` |
| `7` | `4` | `ASSET-007` |
| `8` | `4` | `ASSET-008` |
| `9` | `5` | `ASSET-009` |
| `10` | `5` | `ASSET-010` |

### faults

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| faultid | integer | PK | - |
| username | character varying | - | - |
| userid | integer | FK | users.uid |
| phonenumber | character varying | - | - |
| symptom | character varying | - | - |
| status | integer | FK | tstatus.tstatus |
| seriousness | integer | - | - |
| dateoccured | timestamp without time zone | - | - |
| sitenumber | integer | FK | site.ssitenum |
| areaint | integer | FK | area.aarea |
| sectio_ | character varying | - | - |
| requesttypenew | integer | FK | requesttype.rtid |
| showonweb | boolean | - | - |
| slaid | integer | FK | slahead.slid |
| slastate | character varying | - | - |
| devicenumber | integer | FK | device.devsite |
| devsite | integer | FK | device.devsite |
| fixbydate | timestamp without time zone | - | - |
| cleartime | double precision | - | - |
| clearance | text | - | - |
| datecleared | timestamp without time zone | - | - |
| assignedtoint | integer | FK | uname.unum |
| clearwhoint | integer | FK | uname.unum |
| category2 | character varying | - | - |
| category3 | character varying | - | - |
| category4 | character varying | - | - |
| category5 | character varying | - | - |

Top 10 records:

| faultid | username | userid | phonenumber | symptom | status | seriousness | dateoccured | sitenumber | areaint | sectio_ | requesttypenew | showonweb | slaid | slastate | devicenumber | devsite | fixbydate | cleartime | clearance | datecleared | assignedtoint | clearwhoint | category2 | category3 | category4 | category5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `user_1` | `1` | `555010001` | `Laptop not booting` | `2` | `1` | `2025-01-05T13:30:00.000Z` | `1` | `1` | `IT` | `1` | `true` | `1` | `State1` | `1` | `1` | `2025-01-05T17:30:00.000Z` | `null` | `null` | `null` | `1` | `null` | `Hardware` | `Laptop` | `Boot` | `null` |
| `2` | `user_2` | `2` | `555010002` | `Cannot access email` | `2` | `2` | `2025-01-06T14:00:00.000Z` | `2` | `2` | `IT` | `9` | `true` | `1` | `State2` | `3` | `2` | `2025-01-06T22:00:00.000Z` | `null` | `null` | `null` | `2` | `null` | `Software` | `Email` | `null` | `null` |
| `3` | `user_3` | `3` | `555010003` | `Printer offline` | `6` | `3` | `2025-01-07T15:15:00.000Z` | `3` | `3` | `IT` | `8` | `true` | `1` | `State3` | `5` | `3` | `2025-01-08T15:15:00.000Z` | `1.5` | `Printer driver reinstalled` | `2025-01-07T19:00:00.000Z` | `3` | `3` | `Hardware` | `Printer` | `null` | `null` |
| `4` | `user_4` | `4` | `555010004` | `VPN connection dropping` | `6` | `2` | `2025-01-08T16:00:00.000Z` | `4` | `4` | `IT` | `10` | `true` | `2` | `State4` | `7` | `4` | `2025-01-09T16:00:00.000Z` | `2` | `VPN client updated` | `2025-01-08T20:00:00.000Z` | `4` | `4` | `Network` | `VPN` | `null` | `null` |
| `5` | `user_5` | `5` | `555010005` | `POS system frozen` | `1` | `1` | `2025-01-09T13:00:00.000Z` | `5` | `5` | `Retail` | `1` | `true` | `1` | `null` | `9` | `5` | `2025-01-09T15:00:00.000Z` | `null` | `null` | `null` | `5` | `null` | `Software` | `POS` | `null` | `null` |
| `6` | `user_6` | `6` | `555010006` | `Password reset required` | `6` | `4` | `2025-01-10T18:00:00.000Z` | `6` | `6` | `IT` | `12` | `false` | `2` | `State6` | `11` | `6` | `2025-01-11T18:00:00.000Z` | `0.25` | `Password reset completed` | `2025-01-10T18:30:00.000Z` | `6` | `6` | `Access` | `Password` | `null` | `null` |
| `7` | `user_7` | `7` | `555010007` | `Monitor flickering` | `2` | `3` | `2025-01-11T14:30:00.000Z` | `7` | `7` | `Workshop` | `8` | `true` | `1` | `State7` | `13` | `7` | `2025-01-14T14:30:00.000Z` | `null` | `null` | `null` | `7` | `null` | `Hardware` | `Monitor` | `null` | `null` |
| `8` | `user_8` | `8` | `555010008` | `WiFi dropping in conference rm` | `2` | `2` | `2025-01-12T19:00:00.000Z` | `8` | `8` | `IT` | `10` | `true` | `1` | `State8` | `null` | `null` | `2025-01-13T19:00:00.000Z` | `null` | `null` | `null` | `8` | `null` | `Network` | `WiFi` | `null` | `null` |
| `9` | `user_9` | `9` | `555010009` | `New laptop request` | `6` | `4` | `2025-01-13T15:00:00.000Z` | `9` | `9` | `IT` | `2` | `true` | `1` | `State9` | `null` | `null` | `2025-01-20T15:00:00.000Z` | `0.5` | `Laptop ordered and issued` | `2025-01-20T14:00:00.000Z` | `9` | `9` | `Hardware` | `Laptop` | `New` | `null` |
| `10` | `user_10` | `10` | `555010010` | `Slow PC performance` | `2` | `3` | `2025-01-14T16:30:00.000Z` | `10` | `10` | `IT` | `1` | `true` | `1` | `State10` | `2` | `1` | `2025-01-17T16:30:00.000Z` | `null` | `null` | `null` | `10` | `null` | `Software` | `PC` | `Perf` | `null` |

### invoicedetail

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| idid | integer | PK | - |
| idihid | integer | FK | invoiceheader.ihid |
| iditem_code | character varying | - | - |
| iditem_shortdescription | character varying | - | - |
| iditem_longdescription | character varying | - | - |
| idnominal_code | character varying | - | - |
| idqty_order | double precision | - | - |
| idunit_price | double precision | - | - |
| idnet_amount | double precision | - | - |
| idtax_amount | double precision | - | - |
| idtax_rate | integer | FK | tax.taxid |
| idtax_code | character varying | - | - |
| idunit_cost | double precision | - | - |
| id_itemid | integer | FK | item.iid |
| idfaultid | integer | FK | faults.faultid |

Top 10 records:

| idid | idihid | iditem_code | iditem_shortdescription | iditem_longdescription | idnominal_code | idqty_order | idunit_price | idnet_amount | idtax_amount | idtax_rate | idtax_code | idunit_cost | id_itemid | idfaultid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `LAP-14-8-256` | `Laptop 14"` | `Laptop 14" 8GB/256GB Business` | `5000` | `1` | `999` | `999` | `199.8` | `1` | `T1` | `750` | `1` | `9` |
| `2` | `2` | `AV-1YR-DEV` | `Antivirus 1yr` | `AV licence 1yr per device x50` | `6000` | `50` | `36` | `1800` | `360` | `1` | `T1` | `18` | `15` | `13` |
| `3` | `3` | `MON-27-QHD` | `Monitor 27" QHD` | `Monitor 27" QHD IPS Replacement` | `5000` | `1` | `379` | `379` | `75.8` | `1` | `T1` | `270` | `7` | `7` |
| `4` | `4` | `KEY-USB-UK` | `Keyboard USB` | `Keyboard USB Full Size UK Layout` | `5000` | `1` | `35` | `35` | `7` | `1` | `T1` | `18` | `5` | `15` |
| `5` | `5` | `WAP-AC-POE` | `Access Point AC` | `Wireless AP Dual Band PoE x4` | `5000` | `4` | `189` | `756` | `151.2` | `1` | `T1` | `130` | `9` | `8` |
| `6` | `6` | `RAM-8GB-DDR4` | `Memory 8GB` | `8GB DDR4 3200 DIMM x2` | `5000` | `2` | `29` | `58` | `11.6` | `1` | `T1` | `18` | `13` | `10` |
| `7` | `7` | `LAP-15-16-512` | `Laptop 15" Pro` | `Laptop 15" 16GB/512GB Pro x2` | `5000` | `2` | `1499` | `2998` | `599.6` | `1` | `T1` | `1100` | `2` | `5` |
| `8` | `8` | `LAP-14-8-256` | `Laptop 14"` | `Laptop 14" 8GB/256GB Warranty Rep` | `5000` | `1` | `999` | `999` | `199.8` | `1` | `T1` | `750` | `1` | `1` |
| `9` | `9` | `AV-1YR-DEV` | `Antivirus 1yr` | `Security SW upgrade x20 devices` | `6000` | `20` | `36` | `720` | `144` | `1` | `T1` | `18` | `15` | `12` |
| `10` | `10` | `HDS-USB-MONO` | `Headset USB Mono` | `USB Headset Mono Teams cert x10` | `5000` | `10` | `79` | `790` | `158` | `1` | `T1` | `45` | `11` | `6` |

### invoiceheader

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| ihid | integer | PK | - |
| ihaarea | integer | FK | area.aarea |
| ihsitenumber | integer | FK | site.ssitenum |
| ihuid | integer | FK | users.uid |
| ih3rdpartyinvoicenumber | character varying | - | - |
| ihname | character varying | - | - |
| ihaddress1 | character varying | - | - |
| ihaddress2 | character varying | - | - |
| ihaddress3 | character varying | - | - |
| ihaddress4 | character varying | - | - |
| ihaddress5 | character varying | - | - |
| ihdeladdress1 | character varying | - | - |
| ihdeladdress2 | character varying | - | - |
| ihdeladdress3 | character varying | - | - |
| ihdeladdress4 | character varying | - | - |
| ihdeladdress5 | character varying | - | - |
| ihdatepaid | timestamp without time zone | - | - |

Top 10 records:

| ihid | ihaarea | ihsitenumber | ihuid | ih3rdpartyinvoicenumber | ihname | ihaddress1 | ihaddress2 | ihaddress3 | ihaddress4 | ihaddress5 | ihdeladdress1 | ihdeladdress2 | ihdeladdress3 | ihdeladdress4 | ihdeladdress5 | ihdatepaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `9` | `9` | `9` | `INV-EXT-1001` | `redacted_1` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `101 Example St` | `2025-02-01T05:00:00.000Z` |
| `2` | `13` | `13` | `13` | `INV-EXT-1002` | `redacted_2` | `102 Example St` | `102 Example St` | `102 Example St` | `102 Example St` | `null` | `102 Example St` | `102 Example St` | `102 Example St` | `102 Example St` | `null` | `null` |
| `3` | `7` | `7` | `7` | `INV-EXT-1003` | `redacted_3` | `103 Example St` | `103 Example St` | `103 Example St` | `103 Example St` | `null` | `103 Example St` | `103 Example St` | `103 Example St` | `103 Example St` | `null` | `2025-02-10T05:00:00.000Z` |
| `4` | `15` | `15` | `15` | `INV-EXT-1004` | `redacted_4` | `104 Example St` | `104 Example St` | `104 Example St` | `104 Example St` | `null` | `104 Example St` | `104 Example St` | `104 Example St` | `104 Example St` | `null` | `2025-02-05T05:00:00.000Z` |
| `5` | `8` | `8` | `8` | `INV-EXT-1005` | `redacted_5` | `105 Example St` | `105 Example St` | `105 Example St` | `105 Example St` | `null` | `105 Example St` | `105 Example St` | `105 Example St` | `105 Example St` | `null` | `null` |
| `6` | `10` | `10` | `10` | `INV-EXT-1006` | `redacted_6` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `106 Example St` | `2025-01-30T05:00:00.000Z` |
| `7` | `5` | `5` | `5` | `INV-EXT-1007` | `redacted_7` | `107 Example St` | `107 Example St` | `107 Example St` | `107 Example St` | `null` | `107 Example St` | `107 Example St` | `107 Example St` | `107 Example St` | `null` | `2025-02-08T05:00:00.000Z` |
| `8` | `1` | `1` | `1` | `INV-EXT-1008` | `redacted_8` | `108 Example St` | `108 Example St` | `108 Example St` | `108 Example St` | `null` | `108 Example St` | `108 Example St` | `108 Example St` | `108 Example St` | `null` | `2025-01-28T05:00:00.000Z` |
| `9` | `12` | `12` | `12` | `INV-EXT-1009` | `redacted_9` | `109 Example St` | `109 Example St` | `109 Example St` | `109 Example St` | `null` | `109 Example St` | `109 Example St` | `109 Example St` | `109 Example St` | `null` | `null` |
| `10` | `6` | `6` | `6` | `INV-EXT-1010` | `redacted_10` | `110 Example St` | `110 Example St` | `110 Example St` | `null` | `null` | `110 Example St` | `110 Example St` | `110 Example St` | `null` | `null` | `2025-02-12T05:00:00.000Z` |

### item

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| iid | integer | PK | - |
| igeneric | integer | - | - |
| inote | text | - | - |
| idesc | character varying | - | - |
| idesc2 | character varying | - | - |
| idesc3 | character varying | - | - |
| ibaseprice | money | - | - |
| icostprice | money | - | - |
| isupplier | integer | FK | company.cnum |
| itypenum | integer | - | - |
| iisrecurringitem | bit | - | - |
| irecurringprice | double precision | - | - |
| itaxcode | integer | FK | tax.taxid |
| itaxcodeother | integer | FK | tax.taxid |

Top 10 records:

| iid | igeneric | inote | idesc | idesc2 | idesc3 | ibaseprice | icostprice | isupplier | itypenum | iisrecurringitem | irecurringprice | itaxcode | itaxcodeother |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `Standard laptop` | `Laptop 14"` | `Business` | `8GB/256GB` | `$999.00` | `$750.00` | `1` | `1` | `0` | `0` | `1` | `3` |
| `2` | `1` | `High spec laptop` | `Laptop 15"` | `Pro` | `16GB/512GB` | `$1,499.00` | `$1,100.00` | `1` | `1` | `0` | `0` | `1` | `3` |
| `3` | `2` | `Office desktop` | `Desktop PC` | `Tower` | `16GB/1TB` | `$799.00` | `$580.00` | `2` | `2` | `0` | `0` | `1` | `3` |
| `4` | `3` | `Wireless mouse` | `Mouse Wireless` | `Optical` | `USB-A` | `$25.00` | `$12.00` | `8` | `3` | `0` | `0` | `1` | `3` |
| `5` | `3` | `Wired keyboard` | `Keyboard USB` | `Full size` | `UK layout` | `$35.00` | `$18.00` | `8` | `3` | `0` | `0` | `1` | `3` |
| `6` | `4` | `24 inch monitor` | `Monitor 24"` | `FHD IPS` | `HDMI/DP` | `$229.00` | `$160.00` | `7` | `4` | `0` | `0` | `1` | `3` |
| `7` | `4` | `27 inch monitor` | `Monitor 27"` | `QHD IPS` | `HDMI/DP/USB` | `$379.00` | `$270.00` | `7` | `4` | `0` | `0` | `1` | `3` |
| `8` | `5` | `Network switch` | `Switch 24-Port` | `Managed` | `1Gbps` | `$450.00` | `$310.00` | `5` | `5` | `0` | `0` | `1` | `3` |
| `9` | `5` | `Wireless access point` | `Access Point AC` | `Dual Band` | `PoE` | `$189.00` | `$130.00` | `5` | `5` | `0` | `0` | `1` | `3` |
| `10` | `6` | `UPS 1500VA` | `UPS Tower` | `1500VA` | `900W` | `$299.00` | `$210.00` | `10` | `6` | `0` | `0` | `1` | `3` |

### orderhead

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| ohid | integer | PK | - |
| ohsitenum | integer | FK | site.ssitenum |
| ohnote | text | - | - |
| ohusername | character varying | - | - |
| ohponumber | character varying | - | - |
| ohorderdate | timestamp without time zone | - | - |
| ohshipdate | timestamp without time zone | - | - |
| ohfaultid | integer | FK | faults.faultid |
| ohinvoicedate | timestamp without time zone | - | - |
| ohqhid | integer | FK | quotationheader.qhid |
| ohtitle | character varying | - | - |
| ohcreatedby | integer | FK | uname.unum |
| ohprojectfaultid | integer | FK | faults.faultid |
| ohcurrencycode | integer | - | - |
| ohcurrencyconversionrate | double precision | - | - |
| ohuserid | integer | - | - |
| ohinvoicenumber | integer | FK | invoiceheader.ihid |

Top 10 records:

| ohid | ohsitenum | ohnote | ohusername | ohponumber | ohorderdate | ohshipdate | ohfaultid | ohinvoicedate | ohqhid | ohtitle | ohcreatedby | ohprojectfaultid | ohcurrencycode | ohcurrencyconversionrate | ohuserid | ohinvoicenumber |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `9` | `Urgent laptop required for new starter` | `user_1` | `PO-2025-001` | `2025-01-15T14:00:00.000Z` | `2025-01-18T14:00:00.000Z` | `9` | `2025-01-18T15:00:00.000Z` | `1` | `Laptop - FastFreight` | `9` | `null` | `1` | `1` | `9` | `1` |
| `2` | `13` | `AV renewal 50 devices` | `user_2` | `PO-2025-002` | `2025-01-19T15:00:00.000Z` | `2025-01-20T15:00:00.000Z` | `13` | `2025-01-20T16:00:00.000Z` | `2` | `AV Renewal - PowerGen` | `12` | `null` | `1` | `1` | `13` | `2` |
| `3` | `7` | `Monitor replacement under warranty` | `user_3` | `PO-2025-003` | `2025-01-13T16:00:00.000Z` | `2025-01-16T16:00:00.000Z` | `7` | `2025-01-17T14:00:00.000Z` | `3` | `Monitor - MechWorks` | `11` | `null` | `1` | `1` | `7` | `3` |
| `4` | `15` | `Standard keyboard replacement` | `user_4` | `PO-2025-004` | `2025-01-21T14:00:00.000Z` | `2025-01-23T14:00:00.000Z` | `15` | `2025-01-23T15:00:00.000Z` | `4` | `Keyboard - Prestige` | `14` | `null` | `1` | `1` | `15` | `4` |
| `5` | `8` | `WAP upgrade for conference rooms` | `user_5` | `PO-2025-005` | `2025-01-14T19:00:00.000Z` | `2025-01-21T19:00:00.000Z` | `8` | `2025-01-22T14:00:00.000Z` | `5` | `Network - Grand Hotel` | `7` | `null` | `1` | `1` | `8` | `5` |
| `6` | `10` | `RAM upgrade 2 units` | `user_6` | `PO-2025-006` | `2025-01-16T15:00:00.000Z` | `2025-01-19T15:00:00.000Z` | `10` | `2025-01-20T14:00:00.000Z` | `6` | `RAM - TechNova` | `10` | `null` | `1` | `1` | `10` | `6` |
| `7` | `5` | `POS high spec laptop x2` | `user_7` | `PO-2025-007` | `2025-01-11T13:30:00.000Z` | `2025-01-15T13:30:00.000Z` | `5` | `2025-01-16T14:00:00.000Z` | `7` | `POS Laptops - Quickmart` | `5` | `null` | `1` | `1` | `5` | `7` |
| `8` | `1` | `Warranty laptop replacement` | `user_8` | `PO-2025-008` | `2025-01-07T14:00:00.000Z` | `2025-01-10T14:00:00.000Z` | `1` | `2025-01-11T14:00:00.000Z` | `8` | `Warranty Laptop - Acme` | `1` | `null` | `1` | `1` | `1` | `8` |
| `9` | `12` | `Security software 20 devices` | `user_9` | `PO-2025-009` | `2025-01-18T13:45:00.000Z` | `2025-01-21T13:45:00.000Z` | `12` | `2025-01-22T14:00:00.000Z` | `9` | `Security SW - HelpNow` | `9` | `null` | `1` | `1` | `12` | `9` |
| `10` | `6` | `Headsets x10 for bank floor` | `user_10` | `PO-2025-010` | `2025-01-12T18:00:00.000Z` | `2025-01-16T18:00:00.000Z` | `6` | `2025-01-17T14:00:00.000Z` | `10` | `Headsets - Capital Bank` | `6` | `null` | `1` | `1` | `6` | `10` |

### orderline

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| olid | integer | PK, FK | orderhead.ohid |
| olseq | integer | PK | - |
| olitem | integer | FK | item.iid |
| olorderqty | double precision | - | - |
| olshippedqty | double precision | - | - |
| olnote | character varying | - | - |
| olcostprice | money | - | - |
| olsellingprice | money | - | - |
| olitemlocation | integer | FK | site.ssitenum |
| olpoqty | double precision | - | - |
| oldesc | character varying | - | - |
| olsupplierpo | character varying | - | - |
| olsupplier | integer | FK | company.cnum |
| olquotelineid | integer | FK | quotationdetail.qdid |
| olsupplierpartcode | character varying | - | - |
| olprojectfaultid | integer | FK | faults.faultid |
| oltax | double precision | - | - |
| olsiteid | integer | FK | site.ssitenum |

Top 10 records:

| olid | olseq | olitem | olorderqty | olshippedqty | olnote | olcostprice | olsellingprice | olitemlocation | olpoqty | oldesc | olsupplierpo | olsupplier | olquotelineid | olsupplierpartcode | olprojectfaultid | oltax | olsiteid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `1` | `1` | `1` | `Standard laptop` | `$750.00` | `$999.00` | `9` | `1` | `Laptop 14" 8GB/256GB` | `DELL-PO-001` | `1` | `1` | `LAP-14-8-256` | `null` | `199.8` | `9` |
| `2` | `1` | `15` | `50` | `50` | `AV licence x50` | `$18.00` | `$36.00` | `13` | `50` | `Antivirus 1yr per device` | `MS-PO-001` | `4` | `2` | `AV-1YR-DEV` | `null` | `360` | `13` |
| `3` | `1` | `7` | `1` | `1` | `Monitor replacement` | `$270.00` | `$379.00` | `7` | `1` | `Monitor 27" QHD` | `SAM-PO-001` | `7` | `3` | `MON-27-QHD` | `null` | `75.8` | `7` |
| `4` | `1` | `5` | `1` | `1` | `Standard keyboard` | `$18.00` | `$35.00` | `15` | `1` | `Keyboard USB UK` | `LOG-PO-001` | `8` | `4` | `KEY-USB-UK` | `null` | `7` | `15` |
| `5` | `1` | `9` | `4` | `4` | `WAP x4 for conf rooms` | `$130.00` | `$189.00` | `8` | `4` | `Access Point AC Dual Band` | `CSC-PO-001` | `5` | `5` | `WAP-AC-POE` | `null` | `151.2` | `8` |
| `6` | `1` | `13` | `2` | `2` | `RAM upgrade x2` | `$18.00` | `$29.00` | `10` | `2` | `Memory 8GB DDR4` | `KIN-PO-001` | `13` | `6` | `RAM-8GB-DDR4` | `null` | `11.6` | `10` |
| `7` | `1` | `2` | `2` | `2` | `POS laptop x2` | `$1,100.00` | `$1,499.00` | `5` | `2` | `Laptop 15" 16GB/512GB` | `DELL-PO-002` | `1` | `7` | `LAP-15-16-512` | `null` | `599.6` | `5` |
| `8` | `1` | `1` | `1` | `1` | `Warranty replacement laptop` | `$750.00` | `$999.00` | `1` | `1` | `Laptop 14" 8GB/256GB` | `DELL-PO-003` | `1` | `8` | `LAP-14-8-256` | `null` | `199.8` | `1` |
| `9` | `1` | `15` | `20` | `20` | `Security SW x20` | `$18.00` | `$36.00` | `12` | `20` | `Antivirus 1yr per device` | `MS-PO-002` | `4` | `9` | `AV-1YR-DEV` | `null` | `144` | `12` |
| `10` | `1` | `11` | `10` | `10` | `Headsets x10` | `$45.00` | `$79.00` | `6` | `10` | `Headset USB Mono` | `JAB-PO-001` | `12` | `10` | `HDS-USB-MONO` | `null` | `158` | `6` |

### policy

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| ppolicy | integer | PK | - |
| pslaid | integer | PK, FK | slahead.slid |
| pdesc | character varying | - | - |
| ptime | double precision | - | - |
| punits | character varying | - | - |
| presponsetime | double precision | - | - |
| presponseunits | character varying | - | - |

Top 10 records:

| ppolicy | pslaid | pdesc | ptime | punits | presponsetime | presponseunits |
| --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `P1 - Critical` | `4` | `H` | `1` | `H` |
| `2` | `1` | `P2 - High` | `8` | `H` | `2` | `H` |
| `3` | `1` | `P3 - Medium` | `1` | `D` | `4` | `H` |
| `4` | `1` | `P4 - Low` | `3` | `D` | `8` | `H` |
| `5` | `2` | `P1 - Critical` | `2` | `H` | `0.5` | `H` |
| `6` | `2` | `P2 - High` | `4` | `H` | `1` | `H` |
| `7` | `2` | `P3 - Medium` | `8` | `H` | `2` | `H` |
| `8` | `2` | `P4 - Low` | `2` | `D` | `4` | `H` |
| `9` | `3` | `P1 - Critical` | `1` | `H` | `0.5` | `H` |
| `10` | `3` | `P2 - High` | `4` | `H` | `1` | `H` |

### quotationdetail

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| qdid | integer | PK | - |
| qdproductcode | character varying | - | - |
| qddesc | character varying | - | - |
| qdprice | double precision | - | - |
| qdcostprice | double precision | - | - |
| qdquantity | double precision | - | - |
| qdtax | double precision | - | - |
| qdqhid | integer | FK | quotationheader.qhid |
| qditemid | integer | FK | item.iid |
| qdnote | text | - | - |
| qdsupplier | integer | FK | company.cnum |
| qdsiteid | integer | FK | site.ssitenum |

Top 10 records:

| qdid | qdproductcode | qddesc | qdprice | qdcostprice | qdquantity | qdtax | qdqhid | qditemid | qdnote | qdsupplier | qdsiteid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `LAP-14-8-256` | `Laptop 14" 8GB/256GB` | `999` | `750` | `1` | `199.8` | `1` | `1` | `Standard issue laptop` | `1` | `9` |
| `2` | `AV-1YR-DEV` | `Antivirus 1yr per device` | `36` | `18` | `50` | `360` | `2` | `15` | `50 device renewal` | `4` | `13` |
| `3` | `MON-27-QHD` | `Monitor 27" QHD` | `379` | `270` | `1` | `75.8` | `3` | `7` | `Like-for-like replacement` | `7` | `7` |
| `4` | `KEY-USB-UK` | `Keyboard USB UK` | `35` | `18` | `1` | `7` | `4` | `5` | `Standard keyboard` | `8` | `15` |
| `5` | `WAP-AC-POE` | `Wireless AP Dual Band PoE` | `189` | `130` | `4` | `151.2` | `5` | `9` | `4x WAPs for conf rooms` | `5` | `8` |
| `6` | `RAM-8GB-DDR4` | `Memory 8GB DDR4` | `29` | `18` | `2` | `11.6` | `6` | `13` | `2x 8GB DIMM for upgrade` | `13` | `10` |
| `7` | `LAP-15-16-512` | `Laptop 15" 16GB/512GB` | `1499` | `1100` | `2` | `599.6` | `7` | `2` | `High spec for POS engineer` | `1` | `5` |
| `8` | `LAP-14-8-256` | `Laptop 14" 8GB/256GB` | `999` | `750` | `1` | `199.8` | `8` | `1` | `Warranty replacement unit` | `1` | `1` |
| `9` | `AV-1YR-DEV` | `Antivirus 1yr per device` | `36` | `18` | `20` | `144` | `9` | `15` | `20 device upgrade` | `4` | `12` |
| `10` | `HDS-USB-MONO` | `USB Headset Mono` | `79` | `45` | `10` | `158` | `10` | `5` | `10x MFA headsets` | `12` | `6` |

### quotationheader

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| qhid | integer | PK | - |
| qhfaultid | integer | FK | faults.faultid |
| qhstatus | integer | - | - |
| qhporef | character varying | - | - |
| qhdate | timestamp without time zone | - | - |
| qhexpirydate | timestamp without time zone | - | - |
| qhnote | text | - | - |
| qhuserid | integer | - | - |
| qhunum | integer | FK | uname.unum |
| qhtitle | character varying | - | - |

Top 10 records:

| qhid | qhfaultid | qhstatus | qhporef | qhdate | qhexpirydate | qhnote | qhuserid | qhunum | qhtitle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `9` | `1` | `QT-2025-001` | `2025-01-14T14:00:00.000Z` | `2025-02-14T14:00:00.000Z` | `Laptop for new depot supervisor` | `9` | `9` | `Laptop Supply - FastFreight` |
| `2` | `13` | `1` | `QT-2025-002` | `2025-01-18T15:00:00.000Z` | `2025-02-18T15:00:00.000Z` | `Annual AV licence renewal` | `13` | `12` | `Antivirus Renewal - PowerGen` |
| `3` | `7` | `1` | `QT-2025-003` | `2025-01-12T16:00:00.000Z` | `2025-02-12T16:00:00.000Z` | `Replacement monitor quote` | `7` | `11` | `Monitor Replacement - MechWorks` |
| `4` | `15` | `1` | `QT-2025-004` | `2025-01-20T14:00:00.000Z` | `2025-02-20T14:00:00.000Z` | `Keyboard replacement` | `15` | `14` | `Keyboard - Prestige Estates` |
| `5` | `8` | `1` | `QT-2025-005` | `2025-01-13T19:00:00.000Z` | `2025-02-13T19:00:00.000Z` | `WAP upgrade for conference rooms` | `8` | `7` | `Network Upgrade - Grand Hotel` |
| `6` | `10` | `2` | `QT-2025-006` | `2025-01-15T15:00:00.000Z` | `2025-02-15T15:00:00.000Z` | `RAM upgrade for slow PC` | `10` | `10` | `RAM Upgrade - TechNova` |
| `7` | `5` | `1` | `QT-2025-007` | `2025-01-10T13:30:00.000Z` | `2025-02-10T13:30:00.000Z` | `POS system replacement parts` | `5` | `5` | `POS Parts - Quickmart` |
| `8` | `1` | `3` | `QT-2025-008` | `2025-01-06T14:00:00.000Z` | `2025-02-06T14:00:00.000Z` | `Replacement laptop - warranty claim` | `1` | `1` | `Laptop Warranty - Acme` |
| `9` | `12` | `1` | `QT-2025-009` | `2025-01-17T13:45:00.000Z` | `2025-02-17T13:45:00.000Z` | `Security software upgrade` | `12` | `9` | `Security SW - HelpNow` |
| `10` | `6` | `2` | `QT-2025-010` | `2025-01-11T18:00:00.000Z` | `2025-02-11T18:00:00.000Z` | `MFA token procurement` | `6` | `6` | `MFA Tokens - Capital Bank` |

### requesttype

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| rtid | integer | PK | - |
| rtdesc | character varying | - | - |

Top 10 records:

| rtid | rtdesc |
| --- | --- |
| `1` | `Incident` |
| `2` | `Service Request` |
| `3` | `Change Request` |
| `4` | `Problem` |
| `5` | `Question / Advice` |
| `6` | `New Starter` |
| `7` | `Leaver` |
| `8` | `Hardware Fault` |
| `9` | `Software Fault` |
| `10` | `Network Issue` |

### site

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| ssitenum | integer | PK | - |
| sisinactive | boolean | - | - |
| stimezonename | character varying | - | - |
| smemo | text | - | - |
| sarea | integer | FK | area.aarea |
| sdesc | character varying | - | - |

Top 10 records:

| ssitenum | sisinactive | stimezonename | smemo | sarea | sdesc |
| --- | --- | --- | --- | --- | --- |
| `1` | `false` | `redacted_1` | `HQ` | `1` | `Acme HQ` |
| `2` | `false` | `redacted_2` | `City Hall` | `2` | `City Council Main` |
| `3` | `false` | `redacted_3` | `Main Campus` | `3` | `Greenfield Campus` |
| `4` | `false` | `redacted_4` | `Main Hospital` | `4` | `Metro Hospital` |
| `5` | `false` | `redacted_5` | `Flagship Store` | `5` | `Quickmart Central` |
| `6` | `false` | `redacted_6` | `Head Office` | `6` | `Capital Bank HQ` |
| `7` | `false` | `redacted_7` | `Plant A` | `7` | `MechWorks Plant` |
| `8` | `false` | `redacted_8` | `Main Building` | `8` | `Grand Hotel Paris` |
| `9` | `false` | `redacted_9` | `Depot North` | `9` | `FastFreight North` |
| `10` | `false` | `redacted_10` | `NY Office` | `10` | `TechNova NY` |

### slahead

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| slid | integer | PK | - |
| sldesc | character varying | - | - |

Top 10 records:

| slid | sldesc |
| --- | --- |
| `1` | `Standard SLA` |
| `2` | `Premium SLA` |
| `3` | `Gold SLA` |
| `4` | `Silver SLA` |
| `5` | `Bronze SLA` |
| `6` | `Government SLA` |
| `7` | `Healthcare SLA` |
| `8` | `Education SLA` |
| `9` | `Finance SLA` |
| `10` | `Basic SLA` |

### supplierorderdetail

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| sdid | integer | PK | - |
| sdproductcode | character varying | - | - |
| sddesc | character varying | - | - |
| sdprice | double precision | - | - |
| sdtax | double precision | - | - |
| sdshid | integer | FK | supplierorderheader.shid |
| sditemid | integer | FK | item.iid |
| sdquantity | double precision | - | - |
| sdqtyreceived | double precision | - | - |
| sdtaxcode | integer | FK | tax.taxid |
| sdolid | integer | FK | orderline.olseq |
| sdolseq | integer | FK | orderline.olseq |
| sdnote | text | - | - |
| sdsiteid | integer | FK | site.ssitenum |

Top 10 records:

| sdid | sdproductcode | sddesc | sdprice | sdtax | sdshid | sditemid | sdquantity | sdqtyreceived | sdtaxcode | sdolid | sdolseq | sdnote | sdsiteid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `LAP-14-8-256` | `Laptop 14" 8GB/256GB` | `750` | `150` | `1` | `1` | `1` | `1` | `1` | `1` | `1` | `Single laptop` | `9` |
| `2` | `AV-1YR-DEV` | `Antivirus 1yr per device` | `18` | `3.6` | `2` | `15` | `50` | `50` | `1` | `2` | `1` | `50 device licence keys` | `13` |
| `3` | `MON-27-QHD` | `Monitor 27" QHD` | `270` | `54` | `3` | `7` | `1` | `1` | `1` | `3` | `1` | `Replacement unit` | `7` |
| `4` | `KEY-USB-UK` | `Keyboard USB UK` | `18` | `3.6` | `4` | `5` | `1` | `1` | `1` | `4` | `1` | `Standard keyboard` | `15` |
| `5` | `WAP-AC-POE` | `Access Point Dual Band PoE` | `130` | `26` | `5` | `9` | `4` | `4` | `1` | `5` | `1` | `4x WAPs` | `8` |
| `6` | `RAM-8GB-DDR4` | `8GB DDR4 DIMM` | `18` | `3.6` | `6` | `13` | `2` | `2` | `1` | `6` | `1` | `2x RAM sticks` | `10` |
| `7` | `LAP-15-16-512` | `Laptop 15" 16GB/512GB` | `1100` | `220` | `7` | `2` | `2` | `2` | `1` | `7` | `1` | `POS engineer laptops` | `5` |
| `8` | `LAP-14-8-256` | `Laptop 14" 8GB/256GB` | `750` | `150` | `8` | `1` | `1` | `1` | `1` | `8` | `1` | `Warranty replacement` | `1` |
| `9` | `AV-1YR-DEV` | `Antivirus 1yr per device` | `18` | `3.6` | `9` | `15` | `20` | `20` | `1` | `9` | `1` | `20 device upgrade keys` | `12` |
| `10` | `HDS-USB-MONO` | `USB Headset Mono` | `45` | `9` | `10` | `11` | `10` | `10` | `1` | `10` | `1` | `x10 headsets` | `6` |

### supplierorderheader

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| shid | integer | PK | - |
| shsupplierid | integer | FK | company.cnum |
| shfaultid | integer | FK | faults.faultid |
| shporef | character varying | - | - |
| shpodate | timestamp without time zone | - | - |
| shauthby | integer | - | - |
| shnote | text | - | - |
| shohid | integer | FK | orderhead.ohid |
| shsite | integer | FK | site.ssitenum |
| shusername | character varying | - | - |
| shtitle | character varying | - | - |
| shdatesent | timestamp without time zone | - | - |
| shuserid | integer | FK | users.uid |

Top 10 records:

| shid | shsupplierid | shfaultid | shporef | shpodate | shauthby | shnote | shohid | shsite | shusername | shtitle | shdatesent | shuserid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `9` | `SPO-2025-001` | `2025-01-15T14:30:00.000Z` | `13` | `Laptop order for FastFreight` | `1` | `9` | `user_1` | `Dell Laptop PO` | `2025-01-15T15:00:00.000Z` | `9` |
| `2` | `4` | `13` | `SPO-2025-002` | `2025-01-19T15:30:00.000Z` | `13` | `AV renewal PowerGen` | `2` | `13` | `user_2` | `Microsoft AV PO` | `2025-01-19T16:00:00.000Z` | `13` |
| `3` | `7` | `7` | `SPO-2025-003` | `2025-01-13T16:30:00.000Z` | `13` | `Monitor replacement MechWorks` | `3` | `7` | `user_3` | `Samsung Monitor PO` | `2025-01-13T17:00:00.000Z` | `7` |
| `4` | `8` | `15` | `SPO-2025-004` | `2025-01-21T14:30:00.000Z` | `13` | `Keyboard Prestige Estates` | `4` | `15` | `user_4` | `Logitech Keyboard PO` | `2025-01-21T15:00:00.000Z` | `15` |
| `5` | `5` | `8` | `SPO-2025-005` | `2025-01-14T19:30:00.000Z` | `13` | `WAP order for Grand Hotel` | `5` | `8` | `user_5` | `Cisco WAP PO` | `2025-01-14T20:00:00.000Z` | `8` |
| `6` | `13` | `10` | `SPO-2025-006` | `2025-01-16T15:30:00.000Z` | `13` | `RAM upgrade TechNova` | `6` | `10` | `user_6` | `Kingston RAM PO` | `2025-01-16T16:00:00.000Z` | `10` |
| `7` | `1` | `5` | `SPO-2025-007` | `2025-01-11T14:00:00.000Z` | `13` | `High spec laptop POS Quickmart` | `7` | `5` | `user_7` | `Dell Pro Laptop PO` | `2025-01-11T14:30:00.000Z` | `5` |
| `8` | `1` | `1` | `SPO-2025-008` | `2025-01-07T14:30:00.000Z` | `13` | `Warranty laptop replacement Acme` | `8` | `1` | `user_8` | `Dell Warranty Laptop PO` | `2025-01-07T15:00:00.000Z` | `1` |
| `9` | `4` | `12` | `SPO-2025-009` | `2025-01-18T14:15:00.000Z` | `13` | `Security SW HelpNow` | `9` | `12` | `user_9` | `Microsoft Security SW PO` | `2025-01-18T14:30:00.000Z` | `12` |
| `10` | `12` | `6` | `SPO-2025-010` | `2025-01-12T18:30:00.000Z` | `13` | `Headsets Capital Bank` | `10` | `6` | `user_10` | `Jabra Headset PO` | `2025-01-12T19:00:00.000Z` | `6` |

### tax

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| taxid | integer | PK | - |
| taxdescription | character varying | - | - |
| taxcode | character varying | - | - |
| taxvalue | double precision | - | - |

Top 10 records:

| taxid | taxdescription | taxcode | taxvalue |
| --- | --- | --- | --- |
| `1` | `Standard Rate VAT` | `T1` | `20` |
| `2` | `Reduced Rate VAT` | `T2` | `5` |
| `3` | `Zero Rate VAT` | `T0` | `0` |
| `4` | `Exempt` | `T9` | `0` |
| `5` | `US Sales Tax` | `US1` | `8.25` |
| `6` | `Canadian GST` | `CA1` | `5` |
| `7` | `Canadian HST` | `CA2` | `13` |
| `8` | `Australian GST` | `AU1` | `10` |
| `9` | `EU VAT Standard` | `EU1` | `21` |
| `10` | `EU VAT Reduced` | `EU2` | `9` |

### tree

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| treeid | integer | PK | - |
| treedesc | character varying | - | - |

Top 10 records:

| treeid | treedesc |
| --- | --- |
| `1` | `Corporate` |
| `2` | `Government` |
| `3` | `Education` |
| `4` | `Healthcare` |
| `5` | `Retail` |
| `6` | `Finance` |
| `7` | `Manufacturing` |
| `8` | `Hospitality` |
| `9` | `Logistics` |
| `10` | `Technology` |

### tstatus

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| tstatus | integer | PK | - |
| tstatusdesc | character varying | - | - |

Top 10 records:

| tstatus | tstatusdesc |
| --- | --- |
| `1` | `New` |
| `2` | `In Progress` |
| `3` | `Awaiting User` |
| `4` | `Awaiting Third Party` |
| `5` | `On Hold` |
| `6` | `Resolved` |
| `7` | `Closed` |
| `8` | `Cancelled` |
| `9` | `Reopened` |
| `10` | `Escalated` |

### uname

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| unum | integer | PK | - |
| uname | character varying | - | - |
| usection | character varying | - | - |
| usmtp | character varying | - | - |
| usms | character varying | - | - |
| uad | character varying | - | - |
| uisdisabled | boolean | - | - |
| ujobtitle | character varying | - | - |

Top 10 records:

| unum | uname | usection | usmtp | usms | uad | uisdisabled | ujobtitle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `redacted_1` | `1st Line` | `redacted_1` | `redacted_1` | `tbaker` | `false` | `Junior Technician` |
| `2` | `redacted_2` | `1st Line` | `redacted_2` | `redacted_2` | `sconnor` | `false` | `Junior Technician` |
| `3` | `redacted_3` | `2nd Line` | `redacted_3` | `redacted_3` | `mross` | `false` | `Systems Engineer` |
| `4` | `redacted_4` | `2nd Line` | `redacted_4` | `redacted_4` | `akarev` | `false` | `Systems Engineer` |
| `5` | `redacted_5` | `3rd Line` | `redacted_5` | `redacted_5` | `pgrant` | `false` | `Senior Engineer` |
| `6` | `redacted_6` | `3rd Line` | `redacted_6` | `redacted_6` | `lhale` | `false` | `Senior Engineer` |
| `7` | `redacted_7` | `Network` | `redacted_7` | `redacted_7` | `rstone` | `false` | `Network Engineer` |
| `8` | `redacted_8` | `Network` | `redacted_8` | `redacted_8` | `efox` | `false` | `Network Engineer` |
| `9` | `redacted_9` | `Security` | `redacted_9` | `redacted_9` | `clane` | `false` | `Security Analyst` |
| `10` | `redacted_10` | `Security` | `redacted_10` | `redacted_10` | `dprince` | `false` | `Security Analyst` |

### users

Columns:

| Name | Type | Keys | References |
|---|---|---|---|
| uid | integer | PK | - |
| usite | integer | FK | site.ssitenum |
| uusername | character varying | - | - |
| uextn | character varying | - | - |
| umobile | character varying | - | - |
| uemail | character varying | - | - |
| unotes | text | - | - |
| ulogin | character varying | - | - |
| uinactive | boolean | - | - |

Top 10 records:

| uid | usite | uusername | uextn | umobile | uemail | unotes | ulogin | uinactive |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `1` | `user_1` | `101` | `555010001` | `user1@example.com` | `Key contact` | `ajohnson` | `false` |
| `2` | `2` | `user_2` | `102` | `555010002` | `user2@example.com` | `` | `bsmith` | `false` |
| `3` | `3` | `user_3` | `103` | `555010003` | `user3@example.com` | `IT Lead` | `cwhite` | `false` |
| `4` | `4` | `user_4` | `104` | `555010004` | `user4@example.com` | `` | `dbrown` | `false` |
| `5` | `5` | `user_5` | `105` | `555010005` | `user5@example.com` | `Store Manager` | `edavis` | `false` |
| `6` | `6` | `user_6` | `106` | `555010006` | `user6@example.com` | `` | `fmiller` | `false` |
| `7` | `7` | `user_7` | `107` | `555010007` | `user7@example.com` | `Floor Supervisor` | `gwilson` | `false` |
| `8` | `8` | `user_8` | `108` | `555010008` | `user8@example.com` | `` | `hmoore` | `false` |
| `9` | `9` | `user_9` | `109` | `555010009` | `user9@example.com` | `Depot Manager` | `itaylor` | `false` |
| `10` | `10` | `user_10` | `110` | `555010010` | `user10@example.com` | `` | `janderson` | `false` |


_This file is auto-generated and cleared when DB Explorer is exited._
