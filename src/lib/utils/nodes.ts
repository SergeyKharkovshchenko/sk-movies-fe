interface GraphMapper {
	[key: string]: string;
}

/**
 * A Mapper that corelates a keyword substring contained in the
 * PRODUCT_GROUP value to the corresponding graph name.
 */
const GraphMapper: GraphMapper = {
	screw: 'SCREW/EG',
	piston: 'PISTON',
	booster: 'PISTON'
	// blower: 'BLOWER'
};

export function getGraphName(productGroup: string) {
	const lookup = Object.keys(GraphMapper).filter((key: string) => productGroup.includes(key))?.[0];
	return GraphMapper[lookup];
}

export function findNodesByKeys(nodes: any[], targetKeys: string[]) {
	let result: any[] = [];

	for (const node of nodes) {
		if (!node) continue;

		if (targetKeys == node.nodeKey) {
			result.push(node);
		}

		if (node.children?.length) {
			const found = findNodesByKeys(node.children, targetKeys);
			if (found.length > 0) {
				result = result.concat(found);
			}
		}
	}

	return result;
}

export function findNodeByKey(nodes: any[], targetKey: string): any[] | null {
	for (const node of nodes) {
		if (node.nodeKey === targetKey) {
			return [node];
		}
		if (node.children?.length) {
			const found: any[] | null = findNodeByKey(node.children, targetKey);
			if (found) return found;
		}
	}
	return null;
}

export function removeNodeByKey(nodes: any[], targetKey: string): any[] {
	return nodes
		.filter((node) => node.nodeKey !== targetKey)
		.map((node) => ({
			...node,
			children: node.children ? removeNodeByKey(node.children, targetKey) : []
		}));
}
export function renameNodeByKey(nodes: any[], targetKey: string, newName: string): any[] {
	return nodes.map((node) =>
		node.nodeKey === targetKey
			? { ...node, label: { ...node.label, text: newName } }
			: node.children?.length
				? {
						...node,
						children: renameNodeByKey(
							node.children.filter((child: any) => child),
							targetKey,
							newName
						)
					}
				: node
	);
}

export function replaceChildrenByNodeKey(nodes: any[], targetKey: string, newChildren: any[]): any[] {
	return nodes.map((node) => {
		if (node.nodeKey === targetKey || targetKey == 'root') {
			return { ...node, children: newChildren };
		}
		if (node.children && node.children.length) {
			return {
				...node,
				children: replaceChildrenByNodeKey(node.children, targetKey, newChildren)
			};
		}
		return node;
	});
}

function assignToAllChildrenWithInherited(nodes: any, newProperyBars: any[]) {
	return nodes.forEach((node: any) => {
		const newProperyBarsWithInheritedProperty = newProperyBars.map((propertyBar) => ({
			...propertyBar,
			inherited: true
		}));
		node.assignedPropertyBars = [...newProperyBarsWithInheritedProperty];
		if (node.children && node.children.length > 0) {
			return assignToAllChildrenWithInherited(node.children, newProperyBars);
		}
	});
}

export function assignPropertyBarsByNodeKey(nodes: any[] | undefined, targetKey: string, newProperyBars: any[]): any[] {
	return (nodes || []).map((node) => {
		if (node.nodeKey === targetKey || targetKey == 'root') {
			node.assignedPropertyBars = [...newProperyBars];
			if (node.children && node.children.length) {
				assignToAllChildrenWithInherited(node.children, newProperyBars);
			}
			return { ...node };
		}
		if (node.children && node.children.length) {
			return {
				...node,
				children: assignPropertyBarsByNodeKey(node.children, targetKey, newProperyBars)
			};
		}
		return node;
	});
}

function removeFromAllChildren(node: any, removedProperyBar: any) {
	if (node.assignedPropertyBars) {
		node.assignedPropertyBars = node.assignedPropertyBars.filter(
			(propertyBar: any) => propertyBar.id !== removedProperyBar.id
		);
	}
	if (node.children && node.children.length > 0) {
		node.children.forEach((child: any) => removeFromAllChildren(child, removedProperyBar));
	}
}

export function removePropertyBarFromNodeKey(
	nodes: any[] | undefined,
	targetKey: string,
	removedProperyBar: any
): any[] {
	return (nodes || []).map((node) => {
		if (node.nodeKey === targetKey || targetKey == 'root') {
			removeFromAllChildren(node, removedProperyBar);
			return { ...node };
		}
		if (node.children && node.children.length) {
			return {
				...node,
				children: removePropertyBarFromNodeKey(node.children, targetKey, removedProperyBar)
			};
		}
		return node;
	});
}

export function extractNodeChildren(obj: any) {
	const keys: any = [];

	function traverse(node: any) {
		if (node.children && node.children.length > 0) {
			node.children.forEach((child: any) => {
				keys.push(child.nodeKey);
				traverse(child);
			});
		}
	}

	traverse(obj);
	return keys;
}
