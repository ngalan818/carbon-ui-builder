import React, { useContext } from 'react';
import { NotificationActionType, NotificationContext } from '../../context/notification-context';
import { Modal } from 'carbon-components-react';
import { ModalActionType, ModalContext } from '../../context/modal-context';
import { GlobalStateContext } from '../../context/global-state-context';
import { useHistory, useLocation } from 'react-router-dom';

const getUniqueName = (fragments: Array<any>, name: string) => {
	const nameRegEx = new RegExp(String.raw`(.*)\s+(copy)*(\s+(\d+))?$`);
	const nameMatch = name.match(nameRegEx);
	let count = 0;

	let nameBase = name;
	// If match, increment the count and update name base and new name
	if (nameMatch) {
		nameBase = name.replace(nameRegEx, '$1');
		count = Number.parseInt(name.replace(nameRegEx, '$4'), 10);
		if (!count) {
			count = 0;
		}
	}

	// Get a list containing names of all duplicates of original fragment
	// e.g. [ "Fragment copy", "Fragment copy 1", "Fragment copy 7", ...]
	const names: string[] = [];
	fragments.forEach((fragment) => {
		if (fragment.title.includes(nameBase)) {
			names.push(fragment.title);
		}
	});

	if (names.length <= 1) {
		// because the fragment we're copying is already in there
		return `${nameBase} copy`;
	}

	const highestNumber = names
		.map((n) => Number.parseInt(n.replace(nameRegEx, '$4'), 10))
		.filter((n) => !isNaN(n)).sort((a, b) => b - a)
		.shift();

	return `${nameBase} copy ${highestNumber && count < highestNumber ? highestNumber + 1 : count + 1}`;
};

// In the case that fragment modal is used in the dashboard the full fragment containing options and data
// can't be passed in, so fragment id is passed in and `useFragment` is used within this component.
export const DuplicateFragmentModal = ({ id }: any) => {
	const [modalState, dispatchModal] = useContext(ModalContext);
	const [, dispatchNotification] = useContext(NotificationContext);
	const { fragments, addFragment } = useContext(GlobalStateContext);

	const history = useHistory();
	const location = useLocation();

	const fragment = fragments.find((fragment: any) => fragment.id === id);

	const duplicateFragment = () => {
		// copy current fragment and change fragment title
		const fragmentCopy = JSON.parse(JSON.stringify(fragment));
		fragmentCopy.title = getUniqueName(fragments, fragmentCopy.title);
		fragmentCopy.id = `${Math.random().toString().slice(2)}${Math.random().toString().slice(2)}`;

		addFragment(fragmentCopy);
		if (location.pathname !== '/') {
			history.push(`/edit/${fragmentCopy.id}`);
		}
		dispatchNotification({
			type: NotificationActionType.ADD_NOTIFICATION,
			data: {
				kind: 'success',
				title: 'Duplication success',
				message: `'${fragmentCopy.title}  has been duplicated from '${fragment.title}'.`
			}
		});
		dispatchModal({ type: ModalActionType.closeModal });
	};

	return (
		<Modal
			size='sm'
			open={modalState.ShowModal}
			onRequestClose={() => dispatchModal({ type: ModalActionType.closeModal })}
			secondaryButtonText='Cancel'
			modalHeading='Duplicate fragment?'
			primaryButtonText='Duplicate'
			onRequestSubmit={() => duplicateFragment()}>
			<p>
				Click <strong>Duplicate</strong> to begin to edit a copy of the current fragment
				or <strong>Cancel</strong> to continue on this fragment.
			</p>
		</Modal>
	);
};