var sharp = require('sharp');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

if (process.argv[2] == undefined || process.argv[2] == "") {
	console.log("No icon name.\nUsage: node index.js [(icontyle/)iconname]");
	return;
}

var iconInfo = process.argv[2].split('/');
var iconName;
var iccnType;
if (iconInfo.length == 2) {
	iconType = iconInfo[0];
	iconName = iconInfo[1];
} else {
	iconType = "regular";
	iconName = iconInfo[0];
}

var iconFile = process.cwd() + "/svgs/" + iconType + "/" + iconName + ".svg";
console.log(iconFile);

var xcassetsName = "FontAwesome.xcassets";
// var imagesetName = iconType + "_" + iconName + ".imageset"; // maybe only for non-regular icons...?
var imagesetName = iconName + ".imageset";
var baseFolder = "./";
var outputFolder = baseFolder + xcassetsName + "/" + imagesetName + "/";
var ContentsFile = [
	baseFolder + xcassetsName + "/Contents.json",
	baseFolder + xcassetsName + "/" + imagesetName + "/Contents.json"
]

var outputFilename = iconName;
var outputFileEXT = ".png"
var sizes = [
	{"suffix":"1x", "width": 22, "height": 22},
	{"suffix":"2x", "width": 44, "height": 44},
	{"suffix":"3x", "width": 66, "height": 66}
]

var data = fs.readFileSync(iconFile);
var dataStr = data.toString();

var mkdir = function (directory, recursive = false) {
	return new Promise( function(resolve, reject){
		fs.mkdir(directory, { recursive: recursive }, (err) => {
			console.log(err);
			if (err) return reject(err);
			else resolve();
		});
	});
};

var baseContents = "{\n\t\"info\" : {\n\t\t\"version\" : 1,\n\t\t \"author\" : \"xcode\"\n\t}\n}";
var Contents = {
	"images": [
		{
			"idiom": "universal",
			"filename": outputFilename + "1x" + outputFileEXT,
			"scale": "1x"
		},
		{
			"idiom": "universal",
			"filename": outputFilename + "2x" + outputFileEXT,
			"scale": "2x"
		},
		{
			"idiom": "universal",
			"filename": outputFilename + "3x" + outputFileEXT,
			"scale": "3x"
		}
	],
	"info": {
		"version": 1,
		"author" : "xcode"
	}
}

async function resize(input, width, filename, resolve){
	var runResize = new Promise(function (resolve, reject) {
		sharp(input).resize(width).png().toFile(filename, function (err, info) {
			if (err) {
				reject(err);
			} else {
				resolve(info);
			}
		})
	});

	return new Promise(function(resolve, reject) {
		runResize.then(resolve).catch(function() {
			setTimeout(function() {
				resize(input, width, filename, resolve)
			}, 100);
		});
	});
}


async function execute(){
	await mkdir(outputFolder, true);
	async.map(sizes, async function(item, callback){
		var input = Buffer.from(dataStr);
		var filename = outputFolder + outputFilename + item.suffix + outputFileEXT;
		var result = await resize(input, item.width, filename);
		return result
	}, function(results, results2){
		if (results) {
			console.log(results);
			return;
		}
		fs.writeFileSync(ContentsFile[0], baseContents)
		fs.writeFileSync(ContentsFile[1], JSON.stringify(Contents, null, 1));

		console.log("---------Finished ------------")
	});
}

execute();
