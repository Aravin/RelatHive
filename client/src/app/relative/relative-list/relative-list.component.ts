import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-relative-list',
  templateUrl: './relative-list.component.html',
  styleUrls: ['./relative-list.component.scss']
})
export class RelativeListComponent implements OnInit {

  reatives: any;

  constructor() { }

  ngOnInit() {
    this.reatives = [
      {
        id: 1,
        name: 'Aravind A',
        dob: '27-07-1992',
        degree: [0, 0],
        coupleId: 2
      },
      {
        id: 2,
        name: 'Nisha C',
        dob: '27-07-1992',
        degree: [0, 0],
        coupleId: 1
      },
      {
        id: 3,
        name: 'Appadurai TK',
        dob: '27-07-1992',
        degree: [-1, -1],
        coupleId: 4
      },
      {
        id: 4,
        name: 'Aravind A',
        dob: '27-07-1992',
        degree: [-1, -1],
        coupleId: 3
      },
      {
        id: 5,
        name: 'Varun',
        dob: '27-07-1992',
        degree: [-1, 0],
        coupleId: 4
      },
      {
        id: 6,
        name: 'Padma V',
        dob: '27-07-1992',
        degree: [-1, 0],
        coupleId: 3
      },
      {
        id: 7,
        name: 'Thanu',
        dob: '27-07-1992',
        degree: [-1, 1],
        coupleId: null
      },
      {
        id: 8,
        name: 'Sathish',
        dob: '27-07-1992',
        degree: [0, 1],
        coupleId: null
      },
      {
        id: 9,
        name: 'Lisha',
        dob: '27-07-1992',
        degree: [0, 2],
        coupleId: null,
      },
      {
        id: 10,
        name: 'Usha',
        dob: '27-07-1992',
        degree: [0, 3],
        coupleId: 11,
      },
      {
        id: 11,
        name: 'Bala',
        dob: '27-07-1992',
        degree: [0, 3],
        coupleId: 10,
      },
      {
        id: 12,
        name: 'Bala',
        dob: '27-07-1992',
        degree: [1, 3],
        coupleId: null,
      },
    ];
  }

}
