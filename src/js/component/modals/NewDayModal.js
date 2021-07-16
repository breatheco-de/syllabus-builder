import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import API from "../../api";
import Card from "../cards/card";

const NewDayModal = ({ onConfirm, store, actions, index = null }) => {
	const [profile, setProfile] = useState(null);
	const [academy, setAcademy] = useState(null);
	const [version, setVersion] = useState(null);
	const [newDay, setNewDay] = useState(false);
	const [showDays, setShowDays] = useState(false);
	const [selectedDays, setSelectedDays] = useState([]);

	const shouldBeOpened = () => {
		return academy && academy != "" && profile && profile != "";
	};

	return (
		<div className="modal show d-block new-day" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
			<div className="modal-dialog" role="document">
				<div className="modal-content">
					{!newDay ? (
						<>
							<div className="modal-header">
								<h5 className="modal-title">New Day</h5>
							</div>
							<div className="modal-body text-center">
								<p>You can import a day from another syllabus o add a brand new day </p>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => onConfirm(false)}>
									Close
								</button>
								<button type="button" className="btn btn-primary" onClick={() => setNewDay(true)}>
									Import a day{" "}
								</button>
								<button
									type="button"
									className="btn btn-primary"
									onClick={() => {
										actions.days().add(index);
										onConfirm(false);
									}}>
									Add a new day
								</button>
							</div>
						</>
					) : (
						<>
							<div className="modal-header">
								<h5 className="modal-title">New Day</h5>
							</div>
							<div className="modal-body p-0">
								<div className="row">
									<div className="col-12">
										<div className="input-group mb-2">
											<select
												className="form-control"
												onChange={e => {
													if (e.target.value && e.target.value != "null") {
														API.setOptions({ academy: e.target.value });
														setAcademy(e.target.value);
														if (profile) actions.getSyllabisVersions(e.target.value, profile, true);
														else actions.fetch(["profile"]);
													} else {
														setAcademy(null);
														setProfile(null);
														setVersion(null);
													}
												}}
												value={academy}>
												<option key={0} value={"null"}>
													Select an academy
												</option>
												{store.academies.map((a, i) => {
													return (
														<option key={i} value={a.id}>
															{a.name}
														</option>
													);
												})}
											</select>
											{academy && (
												<select
													className="form-control"
													onChange={e => {
														if (academy && e.target.value && e.target.value != "null") {
															setProfile(e.target.value);
															actions.getSyllabisVersions(academy, e.target.value, true);
														} else {
															setProfile(null);
															setVersion(null);
														}
													}}
													value={profile}>
													<option key={0} value={"null"}>
														Select profile
													</option>
													{store.profiles.map((course, i) => {
														return (
															<option key={i} value={course.slug}>
																{course.slug}
															</option>
														);
													})}
												</select>
											)}
											<select
												className={"form-control  " + (shouldBeOpened() ? "" : "d-none")}
												onChange={e => {
													if (academy && profile && e.target.value && e.target.value != "null") {
														setVersion(e.target.value);
														actions.getApiSyllabusForNewDay(academy, profile, e.target.value);
														setShowDays(true);
													} else {
														setVersion(null);
													}
												}}
												value={version}>
												<option key={0} value={"null"}>
													Select version
												</option>
												{store.imported_syllabus !== null && store.imported_syllabus.length > 0 ? (
													store.imported_syllabus.map((syllabu, i) => {
														return (
															<option key={i} value={syllabu.version}>
																{syllabu.version}
															</option>
														);
													})
												) : (
													<option disabled>no version</option>
												)}
											</select>
										</div>
									</div>
								</div>
								{showDays ? <Card store={store} setSelectedDays={setSelectedDays} selectedDays={selectedDays} /> : null}
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => onConfirm(false)}>
									Close
								</button>
								<button
									type="button"
									className="btn btn-primary"
									onClick={() => {
										actions.days().add(index, selectedDays);
										onConfirm(false);
									}}>
									Confirm
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
NewDayModal.propTypes = {
	profiles: PropTypes.array,
	onConfirm: PropTypes.func,
	store: PropTypes.object,
	actions: PropTypes.object,
	index: PropTypes.any
};
NewDayModal.defaultProps = {
	profiles: []
};

export default NewDayModal;
