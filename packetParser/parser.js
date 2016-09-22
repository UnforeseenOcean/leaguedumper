var nIndex = 0;
function AddByte(dv,aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':1},
						   type: "root"
						  });
	console.log(dv);
	var val = dv.getUint8(nIndex);
	nIndex += 1;
	return val;
}
function AddWord(dv,aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':2},
						   type: "root"
						  });
	var val = dv.getUint16(nIndex,true);
	nIndex += 2;
	return val;
}
function AddDword(dv,aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':4},
						   type: "root"
						  });
	var val = dv.getUint32(nIndex,true);
	nIndex += 4;
	return val;
}
function AddFloat(dv,aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':4},
						   type: "root"
						  });
	var val = dv.getFloat32(nIndex);
	nIndex += 4;
	return val;
}
function AddString(dv,aData,name) {
	var nLen = 0;
	while(dv.getUint8(nIndex+nLen) > 0) {
		nLen++;	
	}
	nLen++;
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':nLen},
						   type: "root"
						  });
	nIndex += nLen;
	return 'string';
}
function AddField(dv,aData,name,len) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':len},
						   type: "root"
						  });
	nIndex += len;
}

function ParsePacket(header,buffer,aData) {
	var dataView = new DataView(buffer);
	nIndex = 0;
		AddByte(dataView,aData,'header');
		AddDword(dataView,aData,'netId');
	if(header == 7) {
	} else if(header == 0xB5) { //PKT_S2C_CastSpellAns
		AddDword(dataView,aData,'clock');
		AddByte(dataView,aData,'unk');
		AddWord(dataView,aData,'wFlag');
		AddDword(dataView,aData,'spellHash');
		AddDword(dataView,aData,'spellNetId');
		AddByte(dataView,aData,'unk');
		AddFloat(dataView,aData,'unk');
		AddDword(dataView,aData,'ownerNetId');
		AddDword(dataView,aData,'ownerNetId');
		AddDword(dataView,aData,'championHash');
		AddDword(dataView,aData,'projectileNetId');
		AddFloat(dataView,aData,'x');
		AddFloat(dataView,aData,'y');
		AddFloat(dataView,aData,'z');
		AddFloat(dataView,aData,'x');
		AddFloat(dataView,aData,'y');
		AddFloat(dataView,aData,'z');
		var vLen = AddByte(dataView,aData,'unk'); //len?
		for(var i = 0; i < vLen;i++) {
			AddDword(dataView,aData,'unkNedId');
			AddByte(dataView,aData,'unkByte');
		}
		AddFloat(dataView,aData,'fChannelTime');
		AddFloat(dataView,aData,'fDelay');
		AddFloat(dataView,aData,'fVisible');
		AddFloat(dataView,aData,'fCooldown');
		AddFloat(dataView,aData,'unk');
		AddByte(dataView,aData,'unk');
		AddByte(dataView,aData,'slot');
		AddFloat(dataView,aData,'cost');
		AddFloat(dataView,aData,'ownerX');
		AddFloat(dataView,aData,'ownerY');
		AddFloat(dataView,aData,'ownerZ');
		AddDword(dataView,aData,'1');
		AddDword(dataView,aData,'0');
	} else if(header == 0xB0) { //PKT_S2C_SpellAnimation
		AddByte(dataView,aData,'unk');
		AddDword(dataView,aData,'unk');
		AddDword(dataView,aData,'unk');
		AddFloat(dataView,aData,'animSpeed');
		AddString(dataView,aData,'animName');
	} else if(header == 0x6B) { //PKT_S2C_SetAnimation
		var nCount = AddByte(dataView,aData,'count')*2;
		for(var i = 0; i < nCount;i++) {
			var nLen = AddDword(dataView,aData,'len');
			AddField(dataView,aData,'anim',nLen);
		}
	} else if(header == 0x55) { //PKT_S2C_BlueTip
		AddField(dataView,aData,'text',128);
		AddField(dataView,aData,'title',256);
		AddByte(dataView,aData,'bDelete');
		AddDword(dataView,aData,'netId');
	} else if(header == 0x6E) { //PKT_S2C_ShowProjectile
		AddDword(dataView,aData,'netId');
	} else if(header == 0x6F) { //PKT_S2C_BuyItemAns
		AddDword(dataView,aData,'itemId');
		AddByte(dataView,aData,'slot');
		AddByte(dataView,aData,'stack');
		AddByte(dataView,aData,'unk');
		AddByte(dataView,aData,'unk');
	} else if(header == 0x34) { //PKT_S2C_StopAutoAttack
		AddDword(dataView,aData,'unk');
		AddByte(dataView,aData,'unk');
	} else if(header == 0x50) { //PKT_S2C_FaceDirection
		AddByte(dataView,aData,'unk');
		AddFloat(dataView,aData,'x');
		AddFloat(dataView,aData,'y');
		AddFloat(dataView,aData,'z');
		AddFloat(dataView,aData,'timeToTurn');
	} else if(header == 0x97) { //PKT_S2C_UpdateModel
		AddDword(dataView,aData,'id');
		AddByte(dataView,aData,'bOk');
		AddDword(dataView,aData,'-1');
		AddField(dataView,aData,'model',32);
	} else if(header == 0x9A) {
		AddByte(dataView,aData,'spellSlotType');
		AddByte(dataView,aData,'spellSlot');
		AddFloat(dataView,aData,'x');
		AddFloat(dataView,aData,'y');
		AddFloat(dataView,aData,'x2');
		AddFloat(dataView,aData,'y2');
		AddDword(dataView,aData,'targetNetId');
			
	}
	if(nIndex < buffer.byteLength) {
		aData.push({ 'text': 'Unknown',
						   'a_attr': {'dataOffset':nIndex,'size':0},
						   type: "root"
						  });
	}
	//..
	return false;
}