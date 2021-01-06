import React, {
    useEffect,
    useState
} from 'react';
import CitationList from '../citationList';
import CitationsBox from '../components/itemPane/citationsBox.jsx';
import PropTypes from 'prop-types';

/* global document, window */
/* global Zotero */

function CitationsBoxContainer(props) {
    console.log('CitationsBoxContainer will render...');
    // fix: where to get citations from (extra field or note) should be configurable
    // therefore, it may be better to have two separate functions

    // Option 1, include citationList in component's internal state.
    // Con: The component will re-render every time the citationList is reinstantiated.
    const [citationList, setCitationList] = useState(
        // If the initial state is the result of an expensive computation,
        // one may provide a function instead, which will be executed only on the initial render.
        () => new CitationList(props.item)
    );

    // Option 2, set citationList as an instance-like variable with useRef.
    // Con: The component will not notice when citationList is reinstantiated.
    // And passing citationList.current as useEffect dependency is bad idea
    // https://github.com/facebook/react/issues/14387#issuecomment-503616820
    // const citationList = useRef(
    //   new CitationList(props.item)
    // );

    // Option 3, set citationList as an instance-like variable with useCallback.
    // Pro: A callback should run when the ref is updated. The callback would update the state.
    // https://github.com/facebook/react/issues/14387#issuecomment-503616820
    // Con: Doesn't seem to work as expected - the ref lacks a `current` property.
    // const citationList = useCallback((citationList) => {
    //   console.log('Running callback...');
    //   setCitations(citationList.citations);
    // }, []);
    // citationList.current = new CitationList(props.item);

    // I don't need a create button next to wikicite field
    // I only have a fetch button. If when fetching no item is found
    // i may offer to create one. But nowhere else.
    // same thing would apply for the editing target items in the citation editor
    // this fetch button calls Wikidata.getQID. A confirmation dialog saying what's
    // gonna happen may have a select option to "also download ciation information from wikidata"
    // calling getQID with getCitations=true

    // In addition to the Wikidata QID field, there will be a DOI field, and maybe a ISBN too
    // This is gonna be the UID area. The providers area
    // I can easily try and fetch a QID or DOI for my source item here
    // only for WIkidata an option to create one if not found will be offered (basic functionality)
    // it is next to these that a "get citations from crossref/wikidata/etc" option will be offered as well
    // or a sync button (but only wikidata will be back and forth)
    // well, actually the forth of DOI may be export in CROCI format
    // get citations from crossref for this DOI / export citations to CROCI for this DOI
    // get citations from Wikidata for this QID / sync citations to Wikidata for this QID
    // OCCID (OpenCitations Corpus ID) makes sense too, because OCI may relate two interanal OC corpus ids

    useEffect(() => {
        console.log('First run, or props.item has changed')
        var observer = {
            notify: async function (action, type, ids, extraData) {
                // This observer will be triggered as long as the component remains mounted
                // That is, until the item selected changes.
                if (type === 'item' && action === 'modify') {
                    console.log('Modified item observer has been triggered...');
                    if (ids.includes(props.item.id)) {
                        // This may cause two re-renders: one when citationList is reset,
                        // and another after citationList-dependent useEffect run above is run.
                        setCitationList(new CitationList(props.item));

                        // If citationList is a ref, state must be updated from here,
                        // because including citationList.current in a useEffect dependency array won't work
                        // https://github.com/facebook/react/issues/14387#issuecomment-503616820
                        // However, this would cause multiple component re-renders
                        // https://stackoverflow.com/questions/59163378/react-hooks-skip-re-render-on-multiple-consecutive-setstate-calls
                        // setCitations(citationList.current.citations);
                        // setDoi(props.item.getField('DOI'));
                        // setOcc(Wikicite.getExtraField(props.item.getField('extra'), 'occ'));
                        // setQid(Wikicite.getExtraField(props.item.getField('extra'), 'qid'));
                    } else if (false) {
                        // I have to check if the target item of one of the linked citations has been modified
                        setCitationList(new CitationList(props.item));
                    }
                }
            }
        };

        var id = Zotero.Notifier.registerObserver(observer, ['item'], 'citationsBox');

        return function cleanup() {
            Zotero.Notifier.unregisterObserver(id);
        };
    }, [props.item]);

    useEffect(() => {
        window.WikiciteChrome.zoteroOverlay.setCitationList(citationList);
    }, [citationList]);

    function handleItemPopup(event) {
        const itemPopupMenu = document.getElementById('citations-box-item-menu');
        event.preventDefault();
        itemPopupMenu.openPopup(event.target, 'end_before', 0, 0, true);
    }

    function handleCitationPopup(event, citationIndex) {
        window.WikiciteChrome.zoteroOverlay.setCitationIndex(citationIndex);
        const citationPopupMenu = document.getElementById('citations-box-citation-menu');
        citationPopupMenu.openPopup(event.target, 'end_before', 0, 0, true);
    }

    return <CitationsBox
        editable={props.editable}
        citationList={citationList}
        onItemPopup={handleItemPopup}
        onCitationPopup={handleCitationPopup}
    />;
}

CitationsBoxContainer.propTypes = {
    item: PropTypes.instanceOf(Zotero.Item),
    editable: PropTypes.bool
}

export default CitationsBoxContainer;
