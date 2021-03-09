## recogniser

### What is this?

Just putting this up here for storage, it's become a bit of a dumping ground of various experiments, but feel free to be inspired by it :-)

### Ummm.... Still not sure....

This was a rough stab at a few image manipulation techniques used for image recognition via NNs, including capturing relevant data, transforming it and feeding it into a NN. It involves:

* Taking a screenshot of a target window by its process ID (including cropping, resizing etc)
* Transforming the image into a more managable format (i.e. grayscale / various HSLA transformations etc) and to emphasise certain elements of interest
* Representing the data as a [HOG](https://en.wikipedia.org/wiki/Histogram_of_oriented_gradients)
* Slicing the image into chunks for processing
* Feeding the data into a trained brain.js NN
* Passing existing training images through the same formatting and HOG processing, then into the BrainJS NN
