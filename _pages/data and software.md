---
layout: page
permalink: /data_software/
title: data and software
description:
nav: true
---

### datasets

**World of International Non-Governmental Organizations (WINGO) Database**, <a href ="https://github.com/ranjitlall/wingo"> hosted on GitHub </a>

The World of International Non-Governmental Organizations (WINGO) database is a comprehensive catalogue of formal international non-governmental organizations (INGOs). The dataset, which encompasses more than 2,600 organizations, is based primarily on the Yearbook of International Organizations, a reference work on international organizations published by the Union of International Associations (UIA). It additionally includes original information on INGOs’ founding dates, dissolution dates, headquarters locations, and issue areas.

**Accountability in Global Governance (AGG) Database**, <a href ="https://github.com/ranjitlall/agg"> hosted on GitHub </a>

The AGG database measures the strength of formal accountability mechanisms possessed by major international institutions. The dataset covers five types of mechanisms --- transparency, evaluation, redress, investigation, and participation mechanisms --- and covers 52 significant international institutions between 1960 and 2018. It also includes a number of additional variables that may be of interest to scholars of accountability in global governance, such as institutions’ governance tasks, decision-making procedures, financial resources, and media coverage.

**Performance of International Institutions Project (PIIP)**, <a href ="https://github.com/ranjitlall/piip"> hosted on GitHub </a>

The PIIP is the most comprehensive dataset on the performance of international institutions. It includes performance ratings of 54 major institutions between 2008 and 2018 by the governments of Australia, Denmark, the Netherlands, Sweden, and the UK and the Multilateral Organization Performance Assessment Network (MOPAN). A wealth of additional information on these institutions, including on their policy autonomy, governance tasks, and operational partnerships, is also provided.

**Project Performance Database (PPD) 2.1**, <a href ="https://www.aiddata.org/data/project-performance-database-ppd-version-2-0"> hosted by AidData </a>

The PPD is the world's largest database of international development projects that includes quantitative ratings of holistic project performance. Version 2.0, developed jointly with Dan Honig and Bradley Parks, contains evaluations of more than 20,000 unique foreign aid projects in 183 countries between 1956 and 2016 by 12 bilateral and multilateral aid agencies.

**Other data**

Most of the datasets used in my other research can be accessed from the [Harvard Dataverse](https://dataverse.harvard.edu/dataverse/harvard/?q=ranjit+lall).

### software

**[MIDASverse](https://github.com/MIDASverse)**: fast and accurate missing-data imputation with deep learning

<img align="right" src="https://user-images.githubusercontent.com/35332935/173778078-eb427fbb-5b55-485d-9698-aa0cbde7ae73.png" width="165" height="165">

The MIDASverse, developed with Thomas Robinson and Alex Stenlake, is a set of software packages for efficiently imputing missing data using deep learning methods in Python (**[MIDASpy](https://github.com/MIDASpy)**) and R (**[rMIDAS](https://github.com/rMIDAS)**). The software implements a recently developed approach to multiple imputation known as MIDAS, which involves introducing additional missing values into the dataset, attempting to reconstruct these values with a type of unsupervised neural network known as a denoising autoencoder, and using the resulting model to draw imputations of originally missing data. These steps are executed by a fast and flexible algorithm that offers significant accuracy and efficiency advantages over other multiple imputation strategies, particularly when applied to large datasets with complex features.

