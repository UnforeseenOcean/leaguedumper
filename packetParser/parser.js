var nIndex = 0;
function AddByte(aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':1},
						   type: "root"
						  });
	nIndex += 1;
}
function AddWord(aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':2},
						   type: "root"
						  });
	nIndex += 2;
}
function AddDword(aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':4},
						   type: "root"
						  });
	nIndex += 4;
}
function AddFloat(aData,name) {
	aData.push({ 'text': name,
						   'a_attr': {'dataOffset':nIndex,'size':4},
						   type: "root"
						  });
	nIndex += 4;
}

function ParsePacket(header,buffer,aData) {
	var dataView = new DataView(buffer);
	nIndex = 0;
	if(header == 7) {
		AddByte(aData,'b1');
		AddByte(aData,'b2');
		//..
	} else if(header == 0x9A) {
		AddByte(aData,'header');
		AddDword(aData,'netId');
		AddByte(aData,'spellSlotType');
		AddByte(aData,'spellSlot');
		AddFloat(aData,'x');
		AddFloat(aData,'y');
		AddFloat(aData,'x2');
		AddFloat(aData,'y2');
		AddDword(aData,'targetNetId');
			
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