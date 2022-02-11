
const fs = require('fs');
const tf =require('@tensorflow/tfjs-node');

const base64 = require('urlsafe-base64')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000

app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors())

app.get('/', (req, res)=>{
res.send("server")
})

app.post('/request', (req, res) =>{;
    var data = req.body.dataUrl.split(',')[1];

    var buf = Buffer.from(data, 'base64')
    //buf = base64.decode(data);

    console.dir(data, {'maxArrayLength': null});
    console.log(JSON.stringify(buf));
})


app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})

function getData(){
    const dataFileBuffer1 = fs.readFileSync(__dirname + '/train-images.idx3-ubyte')
    const labelFileBuffer1 = fs.readFileSync(__dirname + '/train-labels.idx1-ubyte')
    const dataFileBuffer2 = fs.readFileSync(__dirname + '/t10k-images.idx3-ubyte')
    const labelFileBuffer2 = fs.readFileSync(__dirname + '/t10k-labels.idx1-ubyte')

	let train = [];
    let test = [];
    let data = [];

	for (var image = 0; image < 8192; image++) {
		var pixels1 = [];
        var pixels2 = [];

		for (var y = 0; y <= 27; y++) {
			for (var x = 0; x <= 27; x++) {
				pixels1.push(dataFileBuffer1[image * 28 * 28 + (x + y * 28) + 15]/255)
				pixels2.push(dataFileBuffer2[image * 28 * 28 + (x + y * 28) + 15]/255)
			}
		}

		var imageData1 = {}
		var imageData2 = {}

		imageData1= [JSON.stringify(labelFileBuffer1[image + 8]), pixels1]
		imageData2= [JSON.stringify(labelFileBuffer2[image + 8]), pixels2]

        //console.log(imageData1);
		train.push(imageData1)
        test.push(imageData2)
	}

    data.push(train);
    data.push(test);
	
    return data;
}

function getModel(){
    const model = tf.sequential();
  
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1; 

    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));

    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(tf.layers.flatten());

    const NUM_OUTPUT_CLASSES = 10;
    model.add(tf.layers.dense({
      units: NUM_OUTPUT_CLASSES,
      kernelInitializer: 'varianceScaling',
      activation: 'softmax'
    }));

    const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  
    return model;
}

async function train(model, data){
    const BATCH_SIZE = 512;
    const TRAIN = 5500;
    const TEST = 1000;

    const [trainXs, trainYs] = tf.tidy(()=>{
        const d = normalizeData(TRAIN, data[0]);

        return [
            d.xs.reshape([TRAIN, 28, 28, 1]),
            d.labels
        ];
    });

    const [testXs, testYs] = tf.tidy(()=>{
        const d = normalizeData(TEST, data[1]);

        return [
            d.xs.reshape([TEST, 28, 28, 1]),
            d.labels
        ];
    });

    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 5,
        shuffle: true
      });
}

function normalizeData(batchSize, data){
    var imagesArray = new Float32Array(batchSize * 784);
    var labelsArray = new Uint8Array(batchSize * 10);

    
    for (let i = 0; i < batchSize; i++) {
        var image = new Float32Array(data[i][1]);
        output = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        output[data[i][0]] = 1;
        var label = new Uint8Array(output);

        imagesArray.set(image, i*784);
        labelsArray.set(label, i*10);
    }
    
    const xs = tf.tensor2d(imagesArray, [batchSize, 784]);
    const labels = tf.tensor2d(labelsArray, [batchSize, 10]);

    return {xs, labels};
}

async function doPrediction(model, data, batchSize = 500) {
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const testData = normalizeData(batchSize, data)
    const testxs = testData.xs.reshape([batchSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
    const labels = testData.labels.argMax(-1);
    const preds = model.predict(testxs).argMax(-1);
  
    testxs.dispose();
    return [preds, labels];
  }

async function showAccuracy(model, data, batchSize = 500) {
    const [preds, labels] = await doPrediction(model, data, batchSize);
    pred = await preds.data();
    for (let i = 0; i < batchSize; i++){
        console.log(pred[i] +" - "+ data[i][0]);
    }
}

async function start(){
    const data = getData();

    const model = getModel();
    
    await train(model, data);

    await showAccuracy(model, data[0], 20);
}

start();