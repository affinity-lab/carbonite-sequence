import {ModuleManager} from "@affinity-lab/carbonite";
import {DataSource} from "typeorm";
import SequenceDescriptor from "./sequence-descriptor";
import Subscriber from "./subscriber";

let sequenceModuleManager = new (class extends ModuleManager {

	private descriptors: Array<SequenceDescriptor> = [];

	async initialize(dataSource: DataSource) {
		for (let descriptor of this.descriptors) {
			dataSource.subscribers.push(new Subscriber(descriptor, dataSource))
		}
	}

	addDescriptor(descriptor: SequenceDescriptor) { this.descriptors.push(descriptor);}
})();

export default sequenceModuleManager;
